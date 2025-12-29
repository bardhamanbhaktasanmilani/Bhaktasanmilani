"use client";

import { motion } from "framer-motion";

export default function ReturnPolicy() {
  return (
    <section className="bg-[#fff7ea] px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
      
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-serif font-bold text-center text-amber-800"
        >
          Return & Refund Policy
        </motion.h1>

        <div className="w-24 h-1 mx-auto mt-4 mb-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-500" />

       
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">
        
          <p>
            Bardhaman BhaktaSanmilani receives donations strictly in the form of
            voluntary offerings made for religious, spiritual, and charitable
            purposes. These contributions are offered with devotion and are
            allocated towards temple activities and welfare initiatives.
          </p>

          <p>
            As per established religious and charitable practices, all donations
            made to Bardhaman BhaktaSanmilani are treated as final, irrevocable,
            and non-refundable once successfully processed.
          </p>

         
          <h2 className="text-xl font-semibold text-amber-700">
            No Refund Policy
          </h2>
          <p>
            BhaktaSanmilani does not offer refunds or reversals for any donations
            under any circumstances. Once a donation is completed, it cannot be
            canceled, reversed, or refunded.
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Change of mind after making a donation</li>
            <li>Incorrect donation amount entered by the donor</li>
            <li>Multiple donations made intentionally or unintentionally</li>
            <li>
              Disagreement with the utilization or allocation of donated funds
            </li>
            <li>
              Delays or processing issues caused by banks or payment gateways
              beyond the control of the organization
            </li>
          </ul>

         
          <h2 className="text-xl font-semibold text-amber-700">
            Payment Gateway & Bank Exceptions
          </h2>
          <p>
            In rare cases where a transaction fails or is automatically reversed
            by the bank or payment gateway before settlement, the amount may be
            returned directly by the bank or gateway. Such reversals are outside
            the control of Bardhaman BhaktaSanmilani and do not constitute a
            refund issued by the organization.
          </p>

          
          <p>
            This policy ensures that all donations are preserved for their
            intended spiritual and charitable purposes while maintaining
            transparency and accountability in accordance with religious trust
            principles.
          </p>
        </div>
      </div>
    </section>
  );
}
