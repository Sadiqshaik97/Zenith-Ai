import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function UpgradeModal() {
  const isOpen = useStore((state) => state.isUpgradeModalOpen);
  const setOpen = useStore((state) => state.setUpgradeModalOpen);
  const user = useStore((state) => state.user);
  const updateProfile = useStore((state) => state.updateProfile);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('annually');

  if (!isOpen) return null;

  const plans = [
    {
      name: 'Free Starter',
      desc: 'Essential daily logs and task listings.',
      priceMonthly: 0,
      priceAnnually: 0,
      icon: ShieldCheck,
      iconColor: 'text-gray-400',
      buttonText: 'Current Plan',
      buttonClass: 'bg-gray-100 text-gray-500 cursor-default',
      features: [
        'Basic Task Operations',
        'Habits Consistency Tracking',
        'Manual Time Scheduling',
        'Local Data Persistence'
      ],
      unsupported: [
        'AI Constraint Solver scheduling',
        'Aura Cognitive Coach chat',
        'Predictive Focus blocks',
        'Voice Command engine'
      ]
    },
    {
      name: 'Pro Pilot',
      desc: 'Perfect for productivity enthusiasts.',
      priceMonthly: 9,
      priceAnnually: 7,
      popular: true,
      icon: Zap,
      iconColor: 'text-[#D2FC54]',
      buttonText: 'Upgrade to Pro',
      buttonClass: 'bg-[#D2FC54] hover:bg-[#c0ec3d] text-[#161719] hover:scale-[1.02] shadow-md shadow-[#d2fc54]/10 cursor-pointer active:scale-98',
      features: [
        'All Free features',
        'AI Auto-Schedule focus blocks',
        'Dynamic Prioritization scores',
        'Advanced Streak analytics',
        'Voice Voice command engine',
        'Custom calendar tags'
      ],
      unsupported: [
        'Predictive circadian alignment',
        'Aura terminal coach features'
      ]
    },
    {
      name: 'Elite Architect',
      desc: 'The ultimate system for peak performers.',
      priceMonthly: 19,
      priceAnnually: 15,
      icon: Sparkles,
      iconColor: 'text-purple-400',
      buttonText: 'Go Elite',
      buttonClass: 'bg-gray-900 hover:bg-black text-white hover:scale-[1.02] shadow-md cursor-pointer active:scale-98',
      features: [
        'All Pro features',
        'Predictive circadian work blocks',
        'Aura AI terminal coaching chatbot',
        'Advanced productivity insights & export',
        'Priority queue processing',
        'Beta access to predictive metrics'
      ],
      unsupported: []
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#161719]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-[#eef0f2] max-w-5xl w-full rounded-[32px] border border-white/40 shadow-2xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden my-8 max-h-[90vh] md:max-h-none overflow-y-auto"
        >
          {/* Header Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D2FC54] via-purple-400 to-[#D2FC54]"></div>

          {/* Close Button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 hover:bg-white/50 cursor-pointer p-2 rounded-xl transition-all"
            title="Close modal"
          >
            <X size={18} />
          </button>

          {/* Title Header */}
          <div className="text-center flex flex-col items-center gap-1 mt-4 md:mt-2">
            <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200/50 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
              Pricing Options
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-2">
              Elevate Your Focus System
            </h2>
            <p className="text-xs text-gray-500 font-medium max-w-md mt-1 leading-snug">
              Unlock the Aura constraint solver scheduler and cognitive coaching models to optimize your daily workflow.
            </p>
          </div>

          {/* Monthly / Annual Billing Toggle Switch */}
          <div className="flex items-center justify-center gap-3 mt-1.5">
            <span className={`text-xs font-bold transition-colors ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
              Billed Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annually' : 'monthly')}
              className="w-12 h-6 bg-white border border-gray-200 p-0.5 rounded-full flex items-center cursor-pointer transition-colors relative"
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-[#161719] shadow transition-all duration-200 ${
                  billingPeriod === 'annually' ? 'translate-x-6 bg-purple-600' : 'translate-x-0'
                }`}
              ></div>
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold transition-colors ${billingPeriod === 'annually' ? 'text-gray-900' : 'text-gray-400'}`}>
                Billed Annually
              </span>
              <span className="text-[9px] bg-[#D2FC54] text-[#161719] border border-[#d2fc54] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                Save ~20%
              </span>
            </div>
          </div>

          {/* Subscription Plans Grid (Responsive) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {plans.map((plan) => {
              const price = billingPeriod === 'annually' ? plan.priceAnnually : plan.priceMonthly;
              
              return (
                <div
                  key={plan.name}
                  className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between relative ${
                    plan.popular 
                      ? 'border-[#D2FC54] ring-4 ring-[#D2FC54]/10 shadow-lg shadow-[#d2fc54]/5 scale-100 md:scale-[1.03] z-10' 
                      : 'border-gray-200/60 shadow-sm hover:border-gray-300'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute top-[-11px] left-1/2 -translate-x-1/2 bg-[#161719] text-[#D2FC54] border border-[#d2fc54]/10 text-[8px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      Most Popular
                    </span>
                  )}

                  {/* Plan Meta */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900">{plan.name}</h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight">{plan.desc}</p>
                      </div>
                      <div className={`p-2 bg-gray-50 border border-gray-100 rounded-xl ${plan.iconColor}`}>
                        <plan.icon size={18} />
                      </div>
                    </div>

                    {/* Pricing info */}
                    <div className="py-4.5 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900">${price}</span>
                      <span className="text-xs text-gray-400 font-bold">/ month</span>
                      {billingPeriod === 'annually' && price > 0 && (
                        <span className="text-[9px] text-[#7c3aed] font-bold block ml-1.5 font-mono">
                          (Billed ${price * 12}/yr)
                        </span>
                      )}
                    </div>

                    {/* Features list */}
                    <div className="flex flex-col gap-2.5 mt-2">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex gap-2 items-start">
                          <Check className="text-emerald-500 mt-0.5 flex-shrink-0" size={12} />
                          <span className="text-[11px] text-gray-700 font-medium leading-tight">{feature}</span>
                        </div>
                      ))}
                      {plan.unsupported.map((feature) => (
                        <div key={feature} className="flex gap-2 items-start opacity-40">
                          <X className="text-gray-400 mt-0.5 flex-shrink-0" size={12} />
                          <span className="text-[11px] text-gray-500 font-medium leading-tight line-through">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Call-to-action */}
                  <button
                    onClick={() => {
                      const planTier = plan.name === 'Free Starter' ? 'Free' : plan.name === 'Pro Pilot' ? 'Pro' : 'Elite';
                      updateProfile({ tier: planTier });
                      alert(`🎉 Success! Your workspace has been upgraded to ${plan.name} in real-time.`);
                      setOpen(false);
                    }}
                    disabled={user?.tier === (plan.name === 'Free Starter' ? 'Free' : plan.name === 'Pro Pilot' ? 'Pro' : 'Elite')}
                    className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all mt-6 text-center ${
                      user?.tier === (plan.name === 'Free Starter' ? 'Free' : plan.name === 'Pro Pilot' ? 'Pro' : 'Elite')
                        ? 'bg-gray-100 text-gray-400 cursor-default border border-gray-200'
                        : plan.buttonClass
                    }`}
                  >
                    {user?.tier === (plan.name === 'Free Starter' ? 'Free' : plan.name === 'Pro Pilot' ? 'Pro' : 'Elite')
                      ? 'Current Plan'
                      : plan.buttonText}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="text-center text-[10px] text-gray-400 font-medium pb-2">
            Secure processing. You can switch plans or cancel your subscription at any time.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
