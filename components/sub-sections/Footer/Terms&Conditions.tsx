"use client";

import { motion } from "framer-motion";

export default function TermsAndConditions() {
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
          Terms & Conditions
        </motion.h1>

        <div className="w-24 h-1 mx-auto mt-4 mb-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-500" />

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">
          {/* Introduction */}
          <p>
            Welcome to the Bhakta Sammilan website. These Terms and Conditions
            govern your access to and use of this website, including any
            donations made through it. By accessing, browsing, or making a
            contribution on this platform, you acknowledge that you have read,
            understood, and agreed to be bound by these terms.
          </p>

          <p>
            These terms exist to ensure transparency, protect the sanctity of
            donations, and maintain trust between Bhakta Sammilan and its
            devotees, donors, and visitors.
          </p>

          {/* Terms List */}
          <ul className="list-disc pl-6 space-y-3">
            <li>
              All donations made on this website are entirely voluntary and are
              offered without any expectation of material, financial, or
              personal return. Donations are considered sacred offerings made
              in good faith.
            </li>

            <li>
              Contributions received by Bhakta Sammilan are utilized strictly
              for religious, spiritual, charitable, cultural, and community
              welfare activities aligned with the objectives of the trust.
            </li>

            <li>
              The trust reserves the right to allocate, redirect, or utilize
              donated funds based on organizational needs, priorities, and
              lawful obligations, while remaining faithful to its mission.
            </li>

            <li>
              Donors are responsible for ensuring that all personal and payment
              information provided during the donation process is accurate and
              complete. Bhakta Sammilan shall not be held responsible for errors
              arising from incorrect information submitted by users.
            </li>

            <li>
              Donations once made are generally non-reversible and irrevocable,
              as they are treated as offerings made for charitable and
              religious purposes, unless otherwise specified under applicable
              refund policies.
            </li>

            <li>
              Unauthorized use of this website, including attempts to disrupt,
              misuse, or gain unauthorized access to its systems, content, or
              services, is strictly prohibited and may result in legal action.
            </li>

            <li>
              The content, images, text, and materials available on this
              website are the intellectual property of Bhakta Sammilan and may
              not be reproduced, modified, or distributed without prior
              written permission.
            </li>

            <li>
              Bhakta Sammilan shall not be liable for any indirect, incidental,
              or consequential damages arising from the use of this website or
              from delays or interruptions in service beyond reasonable
              control.
            </li>
          </ul>

          {/* Nature of Trust */}
          <p>
            Bhakta Sammilan functions as a religious and charitable trust.
            Donations received are acts of devotion and humanitarian service,
            intended to support spiritual activities, social upliftment, and
            community welfare initiatives.
          </p>

          {/* Governing Law */}
          <h2 className="text-xl font-semibold text-amber-700">
            Governing Law & Jurisdiction
          </h2>
          <p>
            These Terms and Conditions shall be governed by and interpreted in
            accordance with the laws of India. Any disputes arising in
            connection with the use of this website or donations made shall be
            subject to the jurisdiction of competent courts in India.
          </p>

          {/* Changes */}
          <h2 className="text-xl font-semibold text-amber-700">
            Amendments to Terms
          </h2>
          <p>
            Bhakta Sammilan reserves the right to update or modify these Terms
            and Conditions at any time to reflect legal, operational, or
            organizational changes. Continued use of the website after such
            updates constitutes acceptance of the revised terms.
          </p>
        </div>
      </div>
    </section>
  );
}
