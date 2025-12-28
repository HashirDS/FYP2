import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sparkles, Star, Rocket, BookOpen } from 'lucide-react';

const WelcomeMessage = () => {
  const [animationStage, setAnimationStage] = useState('hidden'); // hidden -> circle-expand -> full -> circle-collapse -> hidden
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const animationSequence = async () => {
      // Start with circle expansion
      setAnimationStage('circle-expand');
      
      // Wait for circle to fully expand, then show content
      await new Promise(resolve => setTimeout(resolve, 600));
      setShowContent(true);
      
      // Keep content visible for 4 seconds
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Hide content first
      setShowContent(false);
      
      // Wait a bit, then start circle collapse
      await new Promise(resolve => setTimeout(resolve, 300));
      setAnimationStage('circle-collapse');
      
      // Wait for collapse to complete, then hide completely
      await new Promise(resolve => setTimeout(resolve, 600));
      setAnimationStage('hidden');
    };

    animationSequence();
  }, []);

  if (animationStage === 'hidden') return null;

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-500 ${
        animationStage === 'hidden' ? 'opacity-0' : 'opacity-100'
      }`}>
        
        {/* Circular Container */}
        <div className={`relative flex items-center justify-center ${
          animationStage === 'circle-expand' ? 'animate-circle-expand' :
          animationStage === 'circle-collapse' ? 'animate-circle-collapse' :
          'w-96 h-96'
        }`}>
          
          {/* Circular Background */}
          <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full shadow-2xl border-4 border-white/80 ${
            animationStage === 'circle-expand' ? 'animate-circle-expand-bg' :
            animationStage === 'circle-collapse' ? 'animate-circle-collapse-bg' :
            'w-full h-full'
          }`} />
          
          {/* Content that appears after circle expansion */}
          {showContent && (
            <div className="relative z-10 text-center text-white p-8 animate-content-fade-in">
              
              {/* Animated Icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg backdrop-blur-sm border border-white/30 animate-float">
                  <BrainCircuit className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-6 h-6 text-yellow-300 animate-spin-slow" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold mb-3 text-white drop-shadow-lg">
                Welcome Little Star!
                Smart Tutor For Kids
              </h2>

              {/* Subtitle */}
              <p className="text-lg mb-6 font-medium text-white/90 drop-shadow">
                Let's Start Learning 
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-3 text-white/80">
                  <BookOpen className="w-5 h-5 text-green-300" />
                  <span>Fun Lessons</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-white/80">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <span>3D Teacher</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-white/80">
                  <Rocket className="w-5 h-5 text-blue-300" />
                  <span>Learn with Smart Ways</span>
                </div>
              </div>

              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-8 animate-float-delayed-1">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div className="absolute top-8 right-12 animate-float-delayed-2">
                  <Sparkles className="w-3 h-3 text-pink-300" />
                </div>
                <div className="absolute bottom-12 left-12 animate-float-delayed-3">
                  <Sparkles className="w-5 h-5 text-blue-300" />
                </div>
                <div className="absolute bottom-8 right-8 animate-float-delayed-4">
                  <Sparkles className="w-4 h-4 text-purple-300" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes circleExpand {
          0% {
            width: 0px;
            height: 0px;
            opacity: 0;
          }
          70% {
            width: 420px;
            height: 420px;
            opacity: 1;
          }
          100% {
            width: 384px;
            height: 384px;
            opacity: 1;
          }
        }

        @keyframes circleExpandBg {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes circleCollapse {
          0% {
            width: 384px;
            height: 384px;
            opacity: 1;
          }
          30% {
            width: 420px;
            height: 420px;
            opacity: 1;
          }
          100% {
            width: 0px;
            height: 0px;
            opacity: 0;
          }
        }

        @keyframes circleCollapseBg {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          30% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }

        @keyframes floatDelayed1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-6px) translateX(4px); }
        }

        @keyframes floatDelayed2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(8px) translateX(-3px); }
        }

        @keyframes floatDelayed3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-5px) translateX(-2px); }
        }

        @keyframes floatDelayed4 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(7px) translateX(3px); }
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes contentFadeIn {
          from { 
            opacity: 0; 
            transform: scale(0.8) rotate(-5deg);
          }
          to { 
            opacity: 1; 
            transform: scale(1) rotate(0deg);
          }
        }

        .animate-circle-expand {
          animation: circleExpand 0.6s ease-out forwards;
        }

        .animate-circle-expand-bg {
          animation: circleExpandBg 0.6s ease-out forwards;
        }

        .animate-circle-collapse {
          animation: circleCollapse 0.6s ease-in forwards;
        }

        .animate-circle-collapse-bg {
          animation: circleCollapseBg 0.6s ease-in forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed-1 {
          animation: floatDelayed1 4s ease-in-out infinite;
        }

        .animate-float-delayed-2 {
          animation: floatDelayed2 5s ease-in-out infinite;
        }

        .animate-float-delayed-3 {
          animation: floatDelayed3 6s ease-in-out infinite;
        }

        .animate-float-delayed-4 {
          animation: floatDelayed4 7s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spinSlow 8s linear infinite;
        }

        .animate-content-fade-in {
          animation: contentFadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default WelcomeMessage;