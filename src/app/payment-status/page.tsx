import { Suspense } from 'react';
import PaymentStatusContent from './PaymentStatusContent';

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070b07] text-[#eaeaea] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#dfa032] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Initializing payment verification...</p>
        </div>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}
