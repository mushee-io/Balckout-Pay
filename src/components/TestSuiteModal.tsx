import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, XCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { runPrivacyTestSuite, TestCaseResult } from '../tests/privacy.test';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(0);

  const executeTests = async () => {
    setIsRunning(true);
    const start = performance.now();
    try {
      const results = await runPrivacyTestSuite();
      setTestResults(results);
      setTotalTime(Math.round(performance.now() - start));
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen && testResults.length === 0) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = testResults.filter((t) => t.passed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans select-none">
      <div 
        className="w-full max-w-3xl bg-[#0E0E0E] border border-white/[0.12] p-6 sm:p-8 relative text-left shadow-2xl rounded-[2px] max-h-[90vh] flex flex-col"
        id="modal-test-suite"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.2em] text-[#FF5A5F] uppercase font-bold">
              [ AUTOMATED PROTOCOL SOUNDNESS ]
            </div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
                ZERO-KNOWLEDGE TEST SUITE.
              </h3>
              {testResults.length > 0 && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                  passedCount === testResults.length
                    ? 'bg-[#26A17B]/20 text-[#26A17B] border-[#26A17B]/50'
                    : 'bg-[#FF5A5F]/20 text-[#FF5A5F] border-[#FF5A5F]/50'
                }`}>
                  {passedCount}/{testResults.length} PASSED
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8A8882] hover:text-[#E8E6DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between my-4 border-b border-white/[0.08] pb-3 font-mono text-xs">
          <div className="text-[#8A8882] flex items-center gap-3">
            <span>TESTS: <strong className="text-[#E8E6DF]">{testResults.length}</strong></span>
            <span>DURATION: <strong className="text-[#E8E6DF]">{totalTime}ms</strong></span>
          </div>

          <button
            onClick={executeTests}
            disabled={isRunning}
            id="btn-run-all-tests"
            className="flex items-center gap-2 px-3.5 py-2 bg-[#E8E6DF] text-black hover:bg-white font-bold text-xs uppercase transition-all disabled:opacity-50 cursor-pointer rounded-[2px]"
          >
            {isRunning ? (
              <span>EXECUTING SUITE...</span>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RE-RUN TEST SUITE</span>
              </>
            )}
          </button>
        </div>

        {/* Test List */}
        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 font-mono text-xs">
          {testResults.map((t) => (
            <div
              key={t.id}
              className="p-3.5 bg-[#090909] border border-white/[0.08] flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#26A17B] shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#FF5A5F] shrink-0" />
                  )}
                  <span className="font-bold text-[#E8E6DF]">{t.name}</span>
                  <span className="text-[10px] text-[#8A8882]">[{t.id}]</span>
                </div>
                <p className="text-[#8A8882] pl-6 text-[11px] leading-relaxed">{t.details}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                <span className="text-[10px] text-[#8A8882]">{t.executionTimeMs}ms</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 ${
                  t.passed
                    ? 'bg-[#26A17B]/20 text-[#26A17B] border border-[#26A17B]/40'
                    : 'bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]/40'
                }`}>
                  {t.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          ))}

          {testResults.length === 0 && isRunning && (
            <div className="p-8 text-center text-xs text-[#8A8882]">
              <div>Executing Midnight Zero-Knowledge assertions...</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#8A8882] font-mono">
          <span>Midnight Network Buildathon Invariants</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#141414] hover:bg-[#1f1f1f] border border-white/[0.1] text-[#E8E6DF] font-bold text-xs uppercase cursor-pointer rounded-[2px]"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
