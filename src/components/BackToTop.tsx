import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { currentView, cart, activeOrder, isLoginOpen } = useApp();

  const totalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);

  const isModalActive = Boolean(
    isLoginOpen ||
    (typeof document !== 'undefined' &&
      (document.querySelector('.qty-sheet-backdrop') ||
        document.querySelector('.modal-overlay') ||
        document.querySelector('.drawer-backdrop.active') ||
        document.querySelector('.login-modal-wrapper.active')))
  );

  if (!isVisible || isModalActive) return null;

  useEffect(() => {
    const handleScroll = () => {
      const mainScrollEl = document.querySelector('.main-content-scroll');
      const scrollTop = Math.max(
        window.scrollY || document.documentElement.scrollTop || 0,
        mainScrollEl ? mainScrollEl.scrollTop : 0
      );

      if (scrollTop > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const mainScrollEl = document.querySelector('.main-content-scroll');
    if (mainScrollEl) {
      mainScrollEl.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainScrollEl) {
        mainScrollEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    const mainScrollEl = document.querySelector('.main-content-scroll');
    if (mainScrollEl) {
      mainScrollEl.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  if (!isVisible) return null;

  // Calculate dynamic bottom position so it floats neatly above bottom bars
  let bottomPos = '84px';
  if (currentView !== 'admin') {
    if (activeOrder && totalItems > 0) {
      bottomPos = '148px';
    } else if (activeOrder || totalItems > 0) {
      bottomPos = '130px';
    } else {
      bottomPos = '84px';
    }
  } else {
    bottomPos = '24px';
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="back-to-top-btn"
      style={{ bottom: bottomPos }}
      aria-label="Scroll back to top"
      title="Back to top"
    >
      <ArrowUp size={20} strokeWidth={2.8} />
    </button>
  );
}
