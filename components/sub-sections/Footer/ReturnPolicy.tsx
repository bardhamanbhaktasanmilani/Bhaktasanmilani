"use client";

import { motion } from "framer-motion";

export default function ReturnPolicy() {
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
          Return & Refund Policy
        </motion.h1>

        <div className="w-24 h-1 mx-auto mt-4 mb-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-500" />

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">
          {/* Introduction */}
          <p>
            Bhakta Sammilan receives donations in the form of voluntary offerings
            made for religious, spiritual, and charitable purposes. Such
            contributions are treated with sanctity and are typically allocated
            immediately towards ongoing and planned welfare activities.
          </p>

          <p>
            Due to the nature of these offerings, donations made to Bhakta
            Sammilan are generally considered final and non-refundable.
            However, we recognize that genuine errors may occur, and this
            policy outlines the limited circumstances under which a refund may
            be considered.
          </p>

          {/* Eligibility */}
          <h2 className="text-xl font-semibold text-amber-700">
            Refund Eligibility
          </h2>
          <p>
            A refund may be considered only in exceptional cases where the
            donation was not intended or was affected by a technical issue. Such
            cases include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Duplicate transactions where the same donation amount was
              debited more than once due to a system or payment gateway error
            </li>
            <li>
              Failed or incomplete transactions where the amount was debited
              but the donation was not successfully recorded
            </li>
            <li>
              Clearly identifiable technical errors originating from the
              payment processing system
            </li>
          </ul>

          {/* Non-Eligibility */}
          <h2 className="text-xl font-semibold text-amber-700">
            Non-Refundable Scenarios
          </h2>
          <p>
            Refunds shall not be issued for the following reasons, as donations
            are considered offerings made in good faith:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Change of mind after a successful donation</li>
            <li>Incorrect donation amount entered by the donor</li>
            <li>Disagreement with the trust’s fund allocation decisions</li>
            <li>
              Delays caused by banks or payment gateways beyond the control of
              Bhakta Sammilan
            </li>
          </ul>

          {/* Process */}
          <h2 className="text-xl font-semibold text-amber-700">
            Refund Request Process
          </h2>
          <p>
            Any refund request must be submitted within{" "}
            <strong>7 days</strong> from the date of the transaction. Requests
            should include relevant transaction details such as the transaction
            ID, date, amount, and a brief explanation of the issue.
          </p>

          <p>
            Requests received after this period may not be eligible for review,
            as funds are typically allocated to charitable activities shortly
            after receipt.
          </p>

          {/* Decision */}
          <h2 className="text-xl font-semibold text-amber-700">
            Refund Approval & Processing
          </h2>
          <p>
            All refund requests are carefully reviewed. The decision to approve
            or decline a refund rests solely with Bhakta Sammilan and is based
            on verification of the transaction and the validity of the claim.
          </p>

          <p>
            If approved, refunds will be processed through the original payment
            method and may take several business days to reflect, depending on
            banking and payment gateway timelines.
          </p>

          {/* Closing */}
          <p>
            This policy exists to balance compassion for genuine errors with the
            responsibility of ensuring that donated funds are preserved for
            their intended spiritual and charitable purposes.
          </p>
        </div>
      </div>
    </section>
  );
}
