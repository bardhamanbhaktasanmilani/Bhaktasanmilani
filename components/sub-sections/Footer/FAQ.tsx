"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";




const faqs = [
  {
    question: "What is Bardhaman BhaktaSanmilani?",
    answer:
      "Bardhaman BhaktaSanmilani is a religious and charitable trust dedicated to spiritual activities, community welfare, and humanitarian service. The organization operates on principles of devotion, transparency, and service to society.",
  },
  {
    question: "Are donations mandatory to access the website?",
    answer:
      "No. Accessing and browsing the Bardhaman BhaktaSanmilani website is completely free. Donations are entirely voluntary and are made as offerings in support of religious and charitable activities.",
  },
  {
    question: "How are donations used?",
    answer:
      "All donations are utilized for religious ceremonies, spiritual programs, charitable initiatives, community welfare projects, and the maintenance of trust activities. Fund allocation is guided by organizational priorities and legal obligations.",
  },
  {
    question: "Is my donation secure?",
    answer:
      "Yes. All payments are processed through secure and trusted payment gateways such as Razorpay. Bardhaman BhaktaSanmilani does not store sensitive financial details like card numbers or bank credentials.",
  },
  {
    question: "Will I receive a donation receipt?",
    answer:
      "Yes. Upon successful completion of a donation, an acknowledgment or receipt is issued using the details provided during the transaction. This may be used for personal records or compliance purposes.",
  },
  {
    question: "Can I get a refund for my donation?",
    answer:
      "Donations are generally non-refundable as they are treated as voluntary offerings. However, refunds may be considered in exceptional cases such as duplicate payments or technical transaction errors, subject to review.",
  },
  {
   question: "How can I request a refund if eligible?",
answer:
  "Donations made to Bhakta Sanmilani Temple are voluntary and non-refundable. Once a donation is successfully processed, it cannot be reversed or refunded under any circumstances.",

  },
  {
    question: "Is my personal information safe?",
    answer:
      "Yes. Bardhaman BhaktaSanmilani takes data privacy seriously and implements appropriate safeguards to protect personal information. Data is used only for legitimate purposes such as donation processing and communication.",
  },
  {
    question: "Can I contact Bardhaman BhaktaSanmilani for queries or concerns?",
    answer:
      "Absolutely. If you have any questions, concerns, or require clarification regarding donations, policies, or activities, you may contact us through the official email provided on the website.",
  },
  {
    question: "Can these policies change in the future?",
    answer:
      "Yes. Policies may be updated periodically to reflect legal, operational, or organizational changes. Any updates will be published on the website, and continued use implies acceptance of the revised policies.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[#fff7ea] px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-serif font-bold text-center text-amber-800"
        >
          Frequently Asked Questions
        </motion.h1>

        <div className="w-24 h-1 mx-auto mt-4 mb-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-500" />

        {/* FAQ Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="border border-amber-100 rounded-xl overflow-hidden"
              >
                {/* Question */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-amber-800 font-medium hover:bg-amber-50 transition"
                >
                  <span>{faq.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-amber-600" />
                  </motion.span>
                </button>

                {/* Answer */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 text-gray-700 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
