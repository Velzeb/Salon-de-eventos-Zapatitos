import { Toaster as Sonner } from 'sonner';

const Toaster = () => {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          color: 'var(--text-main)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-main)',
          boxShadow: 'var(--shadow-lg)',
        },
        className: 'premium-toast',
      }}
      expand={true}
      richColors
    />
  );
};

export default Toaster;
