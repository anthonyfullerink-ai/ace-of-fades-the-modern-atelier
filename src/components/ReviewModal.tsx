import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Send, Scissors } from 'lucide-react';
import { Review, submitReview, Booking } from '../services/api';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  show: boolean;
  onClose: () => void;
  booking: Booking;
  onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ show, onClose, booking, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating for your ritual');
      return;
    }

    setSubmitting(true);
    try {
      const review: Review = {
        bookingId: booking.id!,
        userId: booking.userId,
        clientName: booking.customerName || 'Valued Guest',
        rating,
        comment,
        date: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      };

      await submitReview(review);
      toast.success('Thank you for your feedback!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-surface-container border border-outline-variant/10 shadow-2xl overflow-hidden"
          >
            {/* Header Decorations */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary mb-2">FEEDBACK RITUAL</p>
                  <h2 className="font-headline text-3xl font-bold uppercase tracking-tight">Rate Your Experience</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-surface-container-highest transition-colors rounded-full text-on-surface-variant"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8 p-4 bg-surface-container-lowest border border-outline-variant/5">
                <div className="flex items-center gap-3 mb-1">
                  <Scissors className="text-primary" size={14} />
                  <span className="text-xs font-headline font-bold uppercase tracking-widest">{booking.barber}'s Masterpiece</span>
                </div>
                <p className="text-sm text-on-surface-variant">{booking.date} • {booking.time}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-60 text-center block">
                    HOW WOULD YOU RATE THE CUT?
                  </label>
                  <div className="flex justify-center gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          size={36}
                          className={`${
                            (hover || rating) >= star 
                              ? 'fill-primary text-primary' 
                              : 'text-outline-variant opacity-30'
                          } transition-colors duration-200`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                    ADDITIONAL THOUGHTS (OPTIONAL)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us more about your experience..."
                    className="w-full h-32 bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 focus:border-primary focus:outline-none transition-colors resize-none font-body"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-on-primary font-headline uppercase text-xs tracking-[0.2em] font-bold py-5 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? (
                    'RECORDING FEEDBACK...'
                  ) : (
                    <>
                      SUBMIT RITUAL REVIEW <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
            
            {/* Corner Decorative Element */}
            <div className="h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal;
