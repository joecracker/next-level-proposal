export const triggerSafePrint = (proposal?: any) => {
  // Tell the app a proposal was printed/exported, so it can mark it Finished.
  window.dispatchEvent(new CustomEvent('proposal-finished'));
  if (window !== window.top) {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('view', 'preview');
    newUrl.searchParams.set('print', 'true');
    
    if (proposal) {
      (window as any).__PRINT_PROPOSAL_DATA__ = proposal;
    }
    
    const newWindow = window.open(newUrl.toString(), '_blank');
    
    if (newWindow && proposal) {
      let attempts = 0;
      const interval = setInterval(() => {
        newWindow.postMessage({ type: 'PRINT_PROPOSAL_DATA', payload: proposal }, '*');
        attempts++;
        if (attempts > 20) clearInterval(interval);
      }, 500);
      
      const handleMessage = (e: MessageEvent) => {
        if (e.data === 'PRINT_DATA_RECEIVED') {
          clearInterval(interval);
        } else if (e.data === 'READY_FOR_PRINT_DATA') {
          newWindow.postMessage({ type: 'PRINT_PROPOSAL_DATA', payload: proposal }, '*');
        }
      };
      window.addEventListener('message', handleMessage);
      
      // Cleanup listener after 10s
      setTimeout(() => window.removeEventListener('message', handleMessage), 10000);
    }
  } else {
    window.print();
  }
};
