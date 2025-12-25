"use client";

import { motion } from "framer-motion";

export default function PrivacyPolicy() {
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
          Privacy Policy
        </motion.h1>

        <div className="w-24 h-1 mx-auto mt-4 mb-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-500" />

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">
          {/* Introduction */}
          <p>
            Bardhaman BhaktaSanmilani is founded on principles of trust, devotion, and
            service. We deeply respect the privacy of every devotee, donor, and
            visitor who interacts with our platform. This Privacy Policy
            explains, in a transparent manner, how your personal information is
            collected, used, protected, and respected when you visit our website
            or make a donation.
          </p>

          <p>
            By accessing or using this website, you agree to the practices
            described in this policy. We encourage you to read it carefully to
            understand our intentions and responsibilities regarding your data.
          </p>

          {/* Information Collected */}
          <h2 className="text-xl font-semibold text-amber-700">
            Information We Collect
          </h2>
          <p>
            We collect only the minimum information required to ensure smooth
            operation of our services, proper acknowledgment of donations, and
            compliance with legal obligations. This may include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Personal details such as your name, email address, and phone
              number, provided voluntarily during donations or inquiries
            </li>
            <li>
              Donation-related details including amount, date, and transaction
              reference ID
            </li>
            <li>
              Payment confirmation details received from our payment gateway
              (we do <strong>not</strong> store card numbers, CVV, or bank
              credentials)
            </li>
            <li>
              Limited technical data such as browser type, device information,
              and IP address for security and performance monitoring
            </li>
          </ul>

          {/* Purpose */}
          <h2 className="text-xl font-semibold text-amber-700">
            Purpose of Data Collection
          </h2>
          <p>
            Every piece of information collected serves a clear and ethical
            purpose. We use your data strictly to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process donations securely and accurately</li>
            <li>Acknowledge your contribution and issue receipts</li>
            <li>
              Maintain transparent financial records as required by law and
              auditing authorities
            </li>
            <li>
              Communicate important updates related to donations, events, or
              services
            </li>
            <li>
              Protect the platform from fraud, misuse, or unauthorized access
            </li>
          </ul>

          {/* Payment Security */}
          <h2 className="text-xl font-semibold text-amber-700">
            Payment & Transaction Security
          </h2>
          <p>
            All monetary transactions are processed through trusted and
            PCI-DSS–compliant payment gateways such as Razorpay. Bardhaman BhaktaSanmilani
            does not store or process sensitive financial information on its own
            servers. Your payment data remains fully encrypted and handled
            directly by the gateway provider.
          </p>

          {/* Data Protection */}
          <h2 className="text-xl font-semibold text-amber-700">
            Data Protection & Storage
          </h2>
          <p>
            We implement appropriate technical and organizational security
            measures to safeguard your information against unauthorized access,
            alteration, disclosure, or destruction. Access to personal data is
            strictly limited to authorized personnel and used only for
            legitimate purposes.
          </p>

          {/* Cookies */}
          <h2 className="text-xl font-semibold text-amber-700">
            Cookies & Analytics
          </h2>
          <p>
            Our website may use minimal cookies or analytics tools to understand
            website usage patterns and improve user experience. These do not
            personally identify you and are used solely for performance,
            security, and usability enhancements.
          </p>

          {/* User Rights */}
          <h2 className="text-xl font-semibold text-amber-700">
            Your Rights & Choices
          </h2>
          <p>
            You have the right to request access, correction, or deletion of
            your personal information, subject to legal and accounting
            obligations. You may also contact us if you have concerns about how
            your data is handled.
          </p>

          {/* Children */}
          <h2 className="text-xl font-semibold text-amber-700">
            Children’s Privacy
          </h2>
          <p>
            This website is not intended for use by children under the age of
            18 without parental guidance. We do not knowingly collect personal
            information from minors.
          </p>

          {/* Legal */}
          <h2 className="text-xl font-semibold text-amber-700">
            Legal Compliance
          </h2>
          <p>
            This Privacy Policy is governed by and compliant with the
            Information Technology Act, 2000, and applicable data protection
            rules and regulations in India. We adhere to all statutory
            obligations applicable to charitable and religious trusts.
          </p>

          {/* Updates */}
          <h2 className="text-xl font-semibold text-amber-700">
            Policy Updates
          </h2>
          <p>
            Bardhaman BhaktaSanmilani reserves the right to update this Privacy Policy
            from time to time to reflect legal, operational, or technological
            changes. Any updates will be posted on this page with the revised
            effective date.
          </p>

          {/* Contact */}
          <h2 className="text-xl font-semibold text-amber-700">
            Contact Information
          </h2>
          <p>
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or your personal data, please contact us at:
            <br />
            <span className="font-medium text-orange-600">
              bardhamanbhaktasanmilani@gmail.com
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
