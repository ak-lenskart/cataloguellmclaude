'use client';

import { useState, useCallback } from 'react';
import type { JudgeResult, AppStep } from '@/lib/types';
import Header from '@/components/Header';
import ApiKeyInput from '@/components/ApiKeyInput';
import InputPanel from '@/components/InputPanel';
import ImagePreview from '@/components/ImagePreview';
import LoadingState from '@/components/LoadingState';
import ResultsDashboard from '@/components/ResultsDashboard';

export default function Home() {
  const [step, setStep] = useState<AppStep>('input');
  const [pid, setPid] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <ApiKeyInput apiKey={apiKey} onChange={setApiKey} />

        {error && (
          <div className="animate-fade-in rounded-xl px-4 py-3 text-sm border"
            style={{ background: '#ff4d6a15', borderColor: '#ff4d6a40', color: '#ff4d6a' }}>
            {error}
            <button onClick={() => setError('')} className="ml-3 underline opacity-70 hover:opacity-100">
              dismiss
            </button>
          </div>
        )}

        {step === 'input' && (
          <InputPanel
            pid={pid}
            onPidChange={setPid}
            onScrape={handleScrape}
            onManualUrls={handleManualUrls}
          />
        )}

        {(step === 'loading' || step === 'judging') && (
          <LoadingState message={loadingMessage} />
        )}

        {step === 'preview' && (
          <ImagePreview
            images={images}
            selected={selectedImages}
            onSelectionChange={setSelectedImages}
            onJudge={handleJudge}
            onBack={handleReset}
            pid={pid}
          />
        )}

        {step === 'results' && result && (
          <ResultsDashboard
            result={result}
            images={selectedImages}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
