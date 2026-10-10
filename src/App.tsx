/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Proposal, ViewMode, ScopeCategory, CompanyConfig } from './types';
import { SAMPLE_PROPOSAL, DEFAULT_CATEGORIES, DEFAULT_COMPANY_CONFIG, DEFAULT_LEGAL_TERMS, normalizeCategories } from './data/defaultTemplate';
import { Header } from './components/Header';
import { Launcher } from './components/Launcher';
import { WizardSteps } from './components/WizardSteps';
import { ContactInfoStep } from './components/ContactInfoStep';
import { CategorySectionStep } from './components/CategorySectionStep';
import { LegalStep } from './components/LegalStep';
import { DocumentPreview } from './components/DocumentPreview';
import { ContractForms } from './components/ContractForms';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DocxImportModal } from './components/DocxImportModal';
import { EstimateImportModal, EstimateImportResult } from './components/EstimateImportModal';
import { LogoUploadModal } from './components/LogoUploadModal';
import { ProposalsList } from './components/ProposalsList';
import { CategoryModal } from './components/CategoryModal';
import { HowToView } from './components/HowToView';
import { BackupMenu } from './components/BackupMenu';
import { triggerSafePrint } from './printUtils';
import { splitPaymentSchedule } from './lib/money';

const STORAGE_KEY_PROPOSAL = 'jqc_active_proposal_v1';
const STORAGE_KEY_PROPOSALS_LIST = 'jqc_proposals_list_v1';
const STORAGE_KEY_COMPANY_PROFILE = 'pb_company_profile_v1';

export default function App() {
  const [activeModalCategory, setActiveModalCategory] = useState<ScopeCategory | null>(null);
  const [proposal, setProposal] = useState<Proposal>(() => {
    try {
      if (window.opener && (window.opener as any).__PRINT_PROPOSAL_DATA__) {
        return (window.opener as any).__PRINT_PROPOSAL_DATA__;
      }
    } catch (e) {
      // Ignore cross-origin errors if opener is somehow different origin
    }
    // Try to salvage logo from either v1 or v2 if it exists
    let salvagedLogo = '';
    try {
      const v1 = JSON.parse(localStorage.getItem('jqc_active_proposal_v1') || '{}');
      const v2 = JSON.parse(localStorage.getItem('jqc_active_proposal_v2') || '{}');
      if (v1.companyConfig?.logoUrl) salvagedLogo = v1.companyConfig.logoUrl;
      if (v2.companyConfig?.logoUrl) salvagedLogo = v2.companyConfig.logoUrl;
    } catch(e) {}

    const saved = localStorage.getItem(STORAGE_KEY_PROPOSAL);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.companyConfig) {
          parsed.companyConfig = DEFAULT_COMPANY_CONFIG;
        }
        if (!parsed.legalTerms) {
          parsed.legalTerms = DEFAULT_LEGAL_TERMS;
        }
        if (salvagedLogo && !parsed.companyConfig.logoUrl) {
           parsed.companyConfig.logoUrl = salvagedLogo;
        }
        // Older saves still carry ALL-CAPS section names and the old order.
        parsed.categories = normalizeCategories(parsed.categories);

        // Clear dummy data
        const cn = parsed.clientInfo?.clientName || '';
        const title = parsed.title || '';
        if (title.includes('Miller') || title.includes('Bater') || cn.includes('Miller') || cn.includes('Doe') || cn.includes('Bater') || cn.includes('Tammy')) {
          const fresh = { ...SAMPLE_PROPOSAL };
          fresh.companyConfig = { ...parsed.companyConfig };
          return fresh;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved proposal:', e);
      }
    }
    return SAMPLE_PROPOSAL;
  });

  const [savedProposals, setSavedProposals] = useState<Proposal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROPOSALS_LIST);
    if (saved) {
      try {
        const parsed: Proposal[] = JSON.parse(saved);
        const filtered = parsed.filter(p => {
          const title = p.title || '';
          const cn = p.clientInfo?.clientName || '';
          return !title.includes('Miller') && !cn.includes('Miller') && !cn.includes('Bater') && !cn.includes('Tammy');
        });
        const normalized = filtered.map(p => ({ ...p, categories: normalizeCategories(p.categories) }));
        if (normalized.length > 0) return normalized;
      } catch (e) {
        console.error('Failed to parse saved proposals list:', e);
      }
    }
    return [SAMPLE_PROPOSAL];
  });

  // Company Profile: the company's header info + logo, saved in the browser and
  // applied to every new proposal. Seeded from an existing saved profile, then
  // from any previously saved proposal (so existing data isn't lost).
  const [companyProfile, setCompanyProfile] = useState<CompanyConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_COMPANY_PROFILE);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_COMPANY_CONFIG, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved company profile:', e);
      }
    }
    try {
      const v1 = JSON.parse(localStorage.getItem('jqc_active_proposal_v1') || '{}');
      const legacy = v1.companyConfig as CompanyConfig | undefined;
      if (legacy && legacy.companyName) return { ...DEFAULT_COMPANY_CONFIG, ...legacy };
    } catch (e) {
      // ignore
    }
    return DEFAULT_COMPANY_CONFIG;
  });

  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('view') as ViewMode) || 'home';
  });
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [maxReachedStep, setMaxReachedStep] = useState<number>(0);
  const [powerMode, setPowerMode] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Guardrail navigation: advance the "furthest reached" marker whenever we
  // move forward, so locked steps unlock one at a time.
  const goToStep = (idx: number) => {
    setCurrentStepIndex(idx);
    setMaxReachedStep((m) => Math.max(m, idx));
  };

  // Auto-save active proposal to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROPOSAL, JSON.stringify(proposal));
    localStorage.setItem(STORAGE_KEY_PROPOSALS_LIST, JSON.stringify(savedProposals));
  }, [proposal, savedProposals]);

  // Printing or exporting a proposal saves it as Finished, shows a short pop-up, and
// takes the "Continue Working" button off the home screen (it lives in Past Proposals).
  const proposalRef = useRef(proposal);
  proposalRef.current = proposal;
  const [finishedToast, setFinishedToast] = useState<string | null>(null);
  useEffect(() => {
    let timer: number | undefined;
    const onPrinted = () => {
      const done: Proposal = {
        ...proposalRef.current,
        status: 'completed',
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setProposal(done);
      setSavedProposals((prev) =>
        prev.some((p) => p.id === done.id) ? prev.map((p) => (p.id === done.id ? done : p)) : [done, ...prev]
      );
      setIsSaved(true);
      const who = done.clientInfo.clientName;
      setFinishedToast(who ? ('Saved as finished: ' + who) : 'Saved as finished');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setFinishedToast(null), 4500);
    };
    window.addEventListener('proposal-printed', onPrinted);
    return () => {
      window.removeEventListener('proposal-printed', onPrinted);
      window.clearTimeout(timer);
    };
  }, []);


  // Keep the status on the saved-list copy in step with the open proposal.

  useEffect(() => {

    setSavedProposals((prev) =>

      prev.some((p) => p.id === proposal.id && p.status !== proposal.status)

        ? prev.map((p) => (p.id === proposal.id ? { ...p, status: proposal.status } : p))

        : prev

    );

  }, [proposal.id, proposal.status]);


  // Keep the saved company profile in sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPANY_PROFILE, JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('print') === 'true') {
      const handleMessage = (e: MessageEvent) => {
        if (e.data && e.data.type === 'PRINT_PROPOSAL_DATA') {
          const payload = e.data.payload;
          if (!payload.companyConfig) payload.companyConfig = DEFAULT_COMPANY_CONFIG;
          if (!payload.legalTerms) payload.legalTerms = DEFAULT_LEGAL_TERMS;
          setProposal(payload);
          if (e.source) {
            (e.source as Window).postMessage('PRINT_DATA_RECEIVED', '*');
          }
          setTimeout(() => {
            window.print();
          }, 1000);
        }
      };
      window.addEventListener('message', handleMessage);
      
      // Also request it from opener just in case it didn't send
      if (window.opener) {
        (window.opener as Window).postMessage('READY_FOR_PRINT_DATA', '*');
      }

      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);



  const handleUpdateProposal = (edited: Proposal) => {
    // Any edit to a finished proposal puts it back in progress.
    const updated: Proposal = edited.status === 'completed' ? { ...edited, status: 'draft' } : edited;
    setProposal(updated);
    setIsSaved(false);

    // Update in list if exists
    setSavedProposals((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleSaveProposal = () => {
    const updated = {
      ...proposal,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setProposal(updated);

    setSavedProposals((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      if (exists) {
        return prev.map((p) => (p.id === updated.id ? updated : p));
      }
      return [updated, ...prev];
    });

    setIsSaved(true);
  };

  const handleSaveCompanyProfile = (newConfig: CompanyConfig) => {
    setCompanyProfile(newConfig);
    handleUpdateProposal({
      ...proposal,
      companyConfig: newConfig,
    });
  };

  const handleNewProposal = () => {
    const newId = `prop-${Date.now()}`;
    const newProp: Proposal = {
      id: newId,
      title: 'New Client Proposal',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      status: 'draft',
      clientInfo: {
        clientName: '',
        address: '',
        phone: '',
        email: '',
        projectSite: '',
        proposalNumber: '',
        proposalDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        salesRep: '',
      },
      categories: DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        isConfirmed: false,
        items: [],
      })),
      legalTerms: DEFAULT_LEGAL_TERMS,
      companyConfig: companyProfile,
      totalEstimate: '',
      notes: '',
    };

    setProposal(newProp);
    setSavedProposals((prev) => [newProp, ...prev]);
    setMaxReachedStep(0);
    setCurrentStepIndex(0);
    setPowerMode(false);
    setCurrentView('wizard');
    setIsSaved(true);
  };

  const handleDuplicateProposal = (source: Proposal) => {
    const cloned: Proposal = {
      ...source,
      status: 'draft',
      id: `prop-${Date.now()}`,
      title: `${source.title} (Copy)`,
      clientInfo: {
        ...source.clientInfo,
        proposalNumber: '',
        proposalDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      },
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setProposal(cloned);
    setSavedProposals((prev) => [cloned, ...prev]);
    setMaxReachedStep(0);
    setCurrentStepIndex(0);
    setPowerMode(false);
    setCurrentView('wizard');
    setIsSaved(true);
  };

  const handleDeleteProposal = (id: string) => {
    const filtered = savedProposals.filter((p) => p.id !== id);
    setSavedProposals(filtered);

    if (proposal.id === id) {
      if (filtered.length > 0) {
        setProposal(filtered[0]);
      } else {
        handleNewProposal();
      }
    }
  };

  // Add custom scope category
  const handleAddCategory = () => {
    const newCat: ScopeCategory = {
      id: `cat-${Date.now()}`,
      name: 'Custom Work Scope',
      description: 'Custom scope specifications',
      isConfirmed: false,
      items: [],
    };

    handleUpdateProposal({
      ...proposal,
      categories: [...proposal.categories, newCat],
    });

    goToStep(proposal.categories.length + 1);
  };

  // Delete category
  const handleDeleteCategory = (categoryId: string) => {
    const updatedCategories = proposal.categories.filter((c) => c.id !== categoryId);
    handleUpdateProposal({
      ...proposal,
      categories: updatedCategories,
    });
    goToStep(0);
  };

  // Category update
  const handleUpdateCategory = (updatedCat: ScopeCategory) => {
    handleUpdateProposal({
      ...proposal,
      categories: proposal.categories.map((c) => (c.id === updatedCat.id ? updatedCat : c)),
    });
  };

  // Total steps in wizard: 0 (Contact), 1..N (Categories), N+1 (Legal), N+2 (Preview)
  const totalWizardSteps = proposal.categories.length + 3;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#162a4a] via-[#12243f] to-[#0d1a2e] flex flex-col font-sans selection:bg-slate-700 selection:text-slate-100">
      
      {/* Top Fixed Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        proposal={proposal}
        onNewProposal={handleNewProposal}
        onSaveProposal={handleSaveProposal}
        isSaved={isSaved}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <ErrorBoundary>

        {/* VIEW 0: LAUNCHER / HOME */}
        {currentView === 'home' && (
          <Launcher
            hasExistingDraft={proposal.status !== 'completed' && Boolean(
              proposal.clientInfo.clientName ||
              proposal.notes ||
              proposal.categories.some((c) => c.items.length > 0)
            )}
            onNewProposal={handleNewProposal}
            onContinueDraft={() => {
              setMaxReachedStep(Math.max(maxReachedStep, currentStepIndex));
              setCurrentView('wizard');
            }}
            onLoadFromExcel={() => setCurrentView('estimate')}
            onOpenPast={() => setCurrentView('history')}
            onCompanyProfile={() => setCurrentView('settings')}
            onHowTo={() => setCurrentView('howto')}
          />
        )}

        {/* VIEW 1: STEP-BY-STEP DICTATION WIZARD */}
        {currentView === 'wizard' && (
          <div className="space-y-10">
            <div className="print:hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Steps Sidebar */}
              <div className="lg:col-span-4">
                <WizardSteps
                  categories={proposal.categories}
                  currentStepIndex={currentStepIndex}
                  maxReachedStep={maxReachedStep}
                  powerMode={powerMode}
                  onTogglePowerMode={() => setPowerMode((v) => !v)}
                  onSelectStep={(idx) => goToStep(idx)}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onOpenCategoryModal={(cat) => setActiveModalCategory(cat)}
                />
              </div>

              {/* Right Active Step Work Area */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Preview button — quick peek, then jump right back */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentView('preview')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-400/40 shadow-lg px-5 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer"
                    title="Preview the proposal sheet"
                  >
                    <Sparkles className="w-4 h-4 text-slate-300" />
                    <span>Preview</span>
                  </button>
                </div>

                {/* Step 0: Contact Info */}
                {currentStepIndex === 0 && (
                  <ContactInfoStep
                    clientInfo={proposal.clientInfo}
                    notes={proposal.notes || ''}
                    onChangeClientInfo={(info) =>
                      handleUpdateProposal({
                        ...proposal,
                        clientInfo: info,
                        title: info.clientName ? `${info.clientName} Proposal` : proposal.title,
                      })
                    }
                    onChangeNotes={(notesStr) =>
                      handleUpdateProposal({ ...proposal, notes: notesStr })
                    }
                    onConfirmStep={() => goToStep(1)}
                  />
                )}

                {/* Step 1..N: Scope Categories */}
                {currentStepIndex >= 1 && currentStepIndex <= proposal.categories.length && (
                  <CategorySectionStep
                    category={proposal.categories[currentStepIndex - 1]}
                    categoryIndex={currentStepIndex - 1}
                    totalCategories={proposal.categories.length}
                    onUpdateCategory={handleUpdateCategory}
                    onNextStep={() => {
                      if (currentStepIndex < totalWizardSteps - 1) {
                        goToStep(currentStepIndex + 1);
                      } else {
                        setCurrentView('preview');
                      }
                    }}
                    onPrevStep={() => goToStep(currentStepIndex - 1)}
                  />
                )}

                {/* Step N+1: Legal Agreements */}
                {currentStepIndex === proposal.categories.length + 1 && (
                  <LegalStep
                    legalTerms={proposal.legalTerms}
                    totalEstimate={proposal.totalEstimate || ''}
                    onChangeLegalTerms={(terms) =>
                      handleUpdateProposal({ ...proposal, legalTerms: terms })
                    }
                    onChangeTotalEstimate={(estimate) => {
                      const split = splitPaymentSchedule(estimate);
                      handleUpdateProposal({
                        ...proposal,
                        totalEstimate: estimate,
                        legalTerms: split
                          ? { ...proposal.legalTerms, ...split }
                          : proposal.legalTerms,
                      });
                    }}
                    onConfirmStep={() => {
                      goToStep(proposal.categories.length + 2);
                    }}
                    onPrevStep={() => goToStep(proposal.categories.length)}
                  />
                )}

                {/* Step N+2: Preview Embedded */}
                {currentStepIndex === proposal.categories.length + 2 && (
                  <>
                    <DocumentPreview
                      proposal={proposal}
                      onEditSection={(idx) => goToStep(idx)}
                      onOpenCategoryModal={(cat) => setActiveModalCategory(cat)}
                      onPrint={() => {
                        setCurrentView('preview');
                        setTimeout(() => triggerSafePrint(proposal), 700);
                      }}
                    />
                    <ContractForms proposal={proposal} />
                  </>
                )}
              </div>
            </div>
            </div>

          </div>
        )}



        {/* VIEW 2: PROPOSAL SHEET PREVIEW */}
        {currentView === 'preview' && (
          <>
            <DocumentPreview
              proposal={proposal}
              onEditSection={(idx) => {
                goToStep(idx);
                setCurrentView('wizard');
              }}
              onOpenCategoryModal={(cat) => setActiveModalCategory(cat)}
            />
            <ContractForms proposal={proposal} />
          </>
        )}

        {/* VIEW 3: SAVED PROPOSALS LIBRARY */}
        {currentView === 'history' && (
          <ProposalsList
            savedProposals={savedProposals}
            currentProposalId={proposal.id}
            onSelectProposal={(p) => {
              setProposal(p.status === 'completed' ? { ...p, status: 'draft' } : p);
              setMaxReachedStep(0);
              setCurrentStepIndex(0);
              setCurrentView('preview');
            }}
            onNewProposal={handleNewProposal}
            onDuplicateProposal={handleDuplicateProposal}
            onDeleteProposal={handleDeleteProposal}
          />
        )}

        {/* VIEW 4: IMPORT WORD DOC / TEMPLATE TEXT */}
        {currentView === 'import' && (
          <DocxImportModal
            proposal={proposal}
            onImportProposal={(imported) => {
              handleUpdateProposal({
                ...proposal,
                ...imported,
              });
              setMaxReachedStep(0);
              setCurrentStepIndex(0);
              setCurrentView('wizard');
            }}
            onClose={() => setCurrentView('wizard')}
          />
        )}

        {/* VIEW 4B: LOAD THE JOB NUMBERS FROM THE EXCEL ESTIMATE SHEET */}
        {currentView === 'estimate' && (
          <EstimateImportModal
            currentTotal={proposal.totalEstimate || ''}
            materialsSectionCount={
              proposal.categories.find((c) => c.name === 'Material description')?.items.length ?? null
            }
            onApply={(result: EstimateImportResult) => {
              const stamp = Date.now();
              handleUpdateProposal({
                ...proposal,
                status: 'draft',
                title: result.customerName ? `${result.customerName} Proposal` : proposal.title,
                totalEstimate: result.totalEstimate,
                // Each Excel cell lands in its matching slot. An empty cell on the sheet leaves
                // whatever is already typed on the proposal alone.
                clientInfo: {
                  ...proposal.clientInfo,
                  clientName: result.customerName ?? proposal.clientInfo.clientName,
                  address: result.customerAddress ?? proposal.clientInfo.address,
                  phone: result.customerPhone ?? proposal.clientInfo.phone,
                  projectSite: result.jobDescription ?? proposal.clientInfo.projectSite,
                },
                // Starred materials (names only) replace the Material description list.
                categories:
                  result.materials.length > 0
                    ? proposal.categories.map((c) =>
                        c.name === 'Material description'
                          ? {
                              ...c,
                              isConfirmed: false,
                              items: result.materials.map((text, idx) => ({ id: `item-${stamp}-${idx}`, text })),
                            }
                          : c
                      )
                    : proposal.categories,
                legalTerms: {
                  ...proposal.legalTerms,
                  dueAtSigning: result.dueAtSigning,
                  dueAtStart: result.dueAtStart,
                  dueUponCompletion: result.dueUponCompletion,
                },
              });
              setCurrentView('wizard');
              goToStep(proposal.categories.length + 1);
            }}
            onClose={() => setCurrentView('home')}
          />
        )}

        {/* VIEW 5: COMPANY PROFILE, LOGO & HEADER */}
        {currentView === 'settings' && (
          <LogoUploadModal
            companyConfig={companyProfile}
            onUpdateCompanyConfig={handleSaveCompanyProfile}
          />
        )}

        {/* VIEW 6: HOW TO USE */}
        {currentView === 'howto' && <HowToView />}

        </ErrorBoundary>
      </main>

      {/* QUICK EDIT CATEGORY POP-UP MODAL WINDOW */}
      <CategoryModal
        isOpen={Boolean(activeModalCategory)}
        category={activeModalCategory}
        allCategories={proposal.categories}
        onClose={() => setActiveModalCategory(null)}
        onUpdateCategory={handleUpdateCategory}
        onSelectCategory={(cat) => setActiveModalCategory(cat)}
      />

      {finishedToast && (
        <div
          role="status"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] print:hidden rounded-xl border border-emerald-500/60 bg-emerald-950/95 text-emerald-100 px-5 py-3 text-sm font-semibold shadow-2xl"
        >
          {finishedToast}
        </div>
      )}
      <BackupMenu
        proposal={proposal}
        savedProposals={savedProposals}
        onRestore={({ proposal: restoredProposal, savedProposals: restoredList }) => {
          setProposal(restoredProposal);
          setSavedProposals(restoredList);
          setIsSaved(true);
        }}
      />
    </div>
  );
}
