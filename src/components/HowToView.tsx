import React from 'react';
import { HelpCircle, Printer, FileText, Settings, User } from 'lucide-react';

export const HowToView: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto text-slate-200 animate-fade-in">
      <div className="flex items-center space-x-4 mb-8 border-b border-slate-700 pb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
          <HelpCircle className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">How To Use This App</h2>
          <p className="text-slate-400 mt-1">A simple, caveman-style guide to building your proposals.</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Step 1 */}
        <section className="flex gap-4">
          <div className="mt-1 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-amber-400 font-bold">1</div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" /> Fill Out The Client Info
            </h3>
            <p className="text-slate-300 mt-2 leading-relaxed">
              Start on the "Contact Info" step. Type in the client's name, address, and whatever notes you have.
              If typing isn't your thing, use your computer's own voice typing (on Windows: hold the <strong>Windows key</strong> and press <strong>H</strong>) and it will type into any of these boxes for you.
            </p>
          </div>
        </section>

        {/* Step 2 */}
        <section className="flex gap-4">
          <div className="mt-1 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-amber-400 font-bold">2</div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" /> Build the Scope (Category by Category)
            </h3>
            <div className="text-slate-300 mt-2 leading-relaxed space-y-3">
              <p>Click "Next" to go through the different categories (Demolition, Carpentry, Electrical, etc.).</p>
              <p>
                <strong>The Magic Trick:</strong> For each category, you don't need to type out individual lines perfectly.
                Just dump your thoughts into the notes box and <em>write it how you'd say it</em>.
                <br/><br/>
                For example, just rattle off: <br/>
                <em>"We need to tear out the old subfloor, get 12 2x4s, install moisture drywall, and haul away the scrap."</em>
              </p>
              <p>
                You don't even have to say "next line." Just dump your thoughts into the box, then click the golden <strong>"Format with AI"</strong> button. The app will automatically clean up your messy rambling and split it perfectly into sharp, professional bullet points for the contract!
              </p>
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section className="flex gap-4">
          <div className="mt-1 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-amber-400 font-bold">3</div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" /> Add Your Price & Legal Terms
            </h3>
            <p className="text-slate-300 mt-2 leading-relaxed">
              At the very end of the wizard, there's a "Legal & Payment Terms" step. This is where you punch in the total price, the deposit amount, and sign-off terms.
            </p>
          </div>
        </section>

        {/* Step 4 */}
        <section className="flex gap-4">
          <div className="mt-1 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-amber-400 font-bold">4</div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" /> Print It Out!
            </h3>
            <p className="text-slate-300 mt-2 leading-relaxed">
              Once everything looks good in the preview at the bottom, just click the big <strong>Print / PDF</strong> button up in the top right corner. 
              The app will pop open a clean, white, printable sheet and open your browser's print menu. From there, you can print it to paper or save it as a PDF. The app takes care of formatting it nicely for you!
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};
