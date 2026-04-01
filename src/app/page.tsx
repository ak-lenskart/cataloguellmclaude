'use client';

import { useState, useCallback, useRef } from 'react';
import type { JudgeResult, AppStep, AppMode, BatchJob } from '@/lib/types';
import Header from '@/components/Header';
import ApiKeyInput from '@/components/ApiKeyInput';
import InputPanel from '@/components/InputPanel';
import ImagePreview from '@/components/ImagePreview';
import LoadingState from '@/components/LoadingState';
import ResultsDashboard from '@/components/ResultsDashboard';
import BatchInput from '@/components/BatchInput';
import BatchDashboard from '@/components/BatchDashboard';

export default function Home() {
  const [mode, setMode] = useState<AppMode>('single');
  const [step, setStep] = useState<AppStep>('input');
  const [pid, setPid] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  // Batch state
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const stopRef = useRef(false);

  const handleScrape = useCallback(async (inputPid: string) => {
    setPid(inputPid);
    setError('');
    setStep('loading');
    setLoadingMessage('Scraping product images from Lenskart...');

    try {
      const res = await fetch(`/api/scrape?pid=${inputPid}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to scrape images');
      }

      setImages(data.images);
      setSelectedImages(data.images);
      setStep('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Scraping failed');
      setStep('input');
    }
  }, []);

  const handleManualUrls = useCallback((urls: string[], manualPid: string) => {
    setPid(manualPid);
    setImages(urls);
    setSelectedImages(urls);
    setStep('preview');
  }, []);

  const handleJudge = useCallback(async () => {
    if (!apiKey) {
      setError('Please enter your Gemini API key first');
      return;
    }
    if (selectedImages.length === 0) {
      setError('Select at least one image to judge');
      return;
    }

    setError('');
    setStep('judging');
    setLoadingMessage(`Analyzing ${selectedImages.length} images with Gemini Judge LLM...`);

    try {
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, images: selectedImages, apiKey }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Judging failed');
      }

      setResult(data);
      setStep('results');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Judge LLM failed');
      setStep('preview');
    }
  }, [apiKey, selectedImages, pid]);

  const handleReset = useCallback(() => {
    setStep('input');
    setPid('');
    setImages([]);
    setSelectedImages([]);
    setResult(null);
    setError('');
  }, []);

  // Batch processing
  const handleBatchStart = useCallback(async (pids: string[]) => {
    if (!apiKey) {
      setError('Please enter your Gemini API key first');
      return;
    }
    setError('');
    stopRef.current = false;
    setBatchRunning(true);

    const initialJobs: BatchJob[] = pids.map(p => ({ pid: p, status: 'pending' }));
    setBatchJobs(initialJobs);

    for (let i = 0; i < pids.length; i++) {
      if (stopRef.current) break;

      const currentPid = pids[i];

      // Update status: scraping
      setBatchJobs(prev => prev.map(j => j.pid === currentPid ? { ...j, status: 'scraping' } : j));

      try {
        // Scrape
        const scrapeRes = await fetch(`/api/scrape?pid=${currentPid}`);
        const scrapeData = await scrapeRes.json();

        if (!scrapeRes.ok || scrapeData.error) {
          throw new Error(scrapeData.error || 'Scrape failed');
        }

        const imageUrls: string[] = scrapeData.images;

        // Update status: judging
        setBatchJobs(prev => prev.map(j => j.pid === currentPid ? { ...j, status: 'judging', imageCount: imageUrls.length, imageUrls } : j));

        if (stopRef.current) break;

        // Judge
        const judgeRes = await fetch('/api/judge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pid: currentPid, images: imageUrls, apiKey }),
        });
        const judgeData = await judgeRes.json();

        if (!judgeRes.ok || judgeData.error) {
          throw new Error(judgeData.error || 'Judge failed');
        }

        // Update status: done
        setBatchJobs(prev => prev.map(j =>
          j.pid === currentPid ? { ...j, status: 'done', result: judgeData, imageCount: imageUrls.length, imageUrls } : j
        ));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setBatchJobs(prev => prev.map(j =>
          j.pid === currentPid ? { ...j, status: 'error', error: message } : j
        ));
      }

      // Delay between PIDs — Gemini free tier allows ~15 RPM,
      // each PID uses 1 judge call, so 8s gap keeps us safely under the limit
      if (i < pids.length - 1 && !stopRef.current) {
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    }

    setBatchRunning(false);
  }, [apiKey]);

  const handleBatchStop = useCallback(() => {
    stopRef.current = true;
    setBatchRunning(false);
  }, []);

  const handleBatchReset = useCallback(() => {
    setBatchJobs([]);
    setBatchRunning(false);
    stopRef.current = false;
  }, []);

  const showBatchResults = batchJobs.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <ApiKeyInput apiKey={apiKey} onChange={setApiKey} />

        {error && (
          <div className="animate-fade-in rounded-xl px-4 py-3 text-sm border"
            style={{ background: '#ff4d6a15', borderColor: '#ff4d6a40', color: '#ff4d6a' }}>
            {error}
            <button onClick={() => setError('')} className="ml-3 underline opacity-70 hover:opacity-100">dismiss</button>
          </div>
        )}

        {/* Mode Switcher — only show when in input state and no batch results */}
        {step === 'input' && !showBatchResults && (
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['single', 'batch'] as AppMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 px-6 py-3 text-sm font-medium transition-colors relative"
                style={{
                  color: mode === m ? 'var(--accent)' : 'var(--text-dim)',
                  background: mode === m ? 'var(--accent-glow)' : 'var(--bg-card)',
                }}
              >
                {m === 'single' ? 'Single PID' : 'Batch Analysis (up to 500)'}
                {mode === m && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--accent)' }} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Single mode */}
        {mode === 'single' && !showBatchResults && (
          <>
            {step === 'input' && (
              <InputPanel pid={pid} onPidChange={setPid} onScrape={handleScrape} onManualUrls={handleManualUrls} />
            )}
            {(step === 'loading' || step === 'judging') && (
              <LoadingState message={loadingMessage} />
            )}
            {step === 'preview' && (
              <ImagePreview images={images} selected={selectedImages} onSelectionChange={setSelectedImages} onJudge={handleJudge} onBack={handleReset} pid={pid} />
            )}
            {step === 'results' && result && (
              <ResultsDashboard result={result} images={selectedImages} onReset={handleReset} />
            )}
          </>
        )}

        {/* Batch mode — input */}
        {mode === 'batch' && !showBatchResults && step === 'input' && (
          <BatchInput onStart={handleBatchStart} disabled={batchRunning} />
        )}

        {/* Batch mode — results dashboard */}
        {showBatchResults && (
          <BatchDashboard jobs={batchJobs} onReset={handleBatchReset} onStop={handleBatchStop} isRunning={batchRunning} />
        )}
      </main>
    </div>
  );
}
