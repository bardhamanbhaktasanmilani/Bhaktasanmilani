"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

export default function ContactSection() {
  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setToast({
        type: "error",
        message: "Please fill in your name, email and message.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit your query.");
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      // Show success toast
      setToast({
        type: "success",
        message: "Your query has been submitted.",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      setToast({
        type: "error",
        message:
          "Something went wrong. Please try again in a while or email us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast (top-right corner, light green, rounded 20px) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 40, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 40, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed z-50 flex items-start gap-3 p-3 sm:p-4 top-4 right-4"
          >
            <div
              className={`flex items-start gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-[20px] shadow-lg border text-sm sm:text-[15px] max-w-xs sm:max-w-sm ${
                toast.type === "success"
                  ? "bg-green-50 border-green-200 text-green-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <div className="mt-0.5">
                {toast.type === "success" ? (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                ) : (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold mb-0.5">
                  {toast.type === "success" ? "Success" : "Oops"}
                </p>
                <p className="leading-snug">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="mt-0.5 rounded-full p-1 hover:bg-black/5 transition"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main section */}
      <section
        id="contact"
        className="relative flex items-center justify-center py-12 sm:py-16 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
      >
        {/* soft glowing background orbs */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute w-64 h-64 rounded-full bg-orange-200/60 blur-3xl -top-10 -left-10" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-amber-300/60 blur-3xl" />
        </div>

        <div className="w-full max-w-6xl px-4 mx-auto sm:px-6 lg:px-8">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8 text-center sm:mb-10"
          >
            <h2 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
              Contact{" "}
              <span className="text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text">
                Us
              </span>
            </h2>
            <div className="w-20 h-1 mx-auto mb-4 bg-gradient-to-r from-orange-600 to-amber-600 sm:w-24" />
            <p className="max-w-2xl mx-auto text-base text-gray-600 sm:text-lg">
              Have questions or want to get involved? We&apos;d love to hear
              from you.
            </p>
          </motion.div>

          {/* Content */}
          <div className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_1fr]">
            {/* LEFT: contact info + map */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-5 sm:space-y-6"
            >
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 shadow-lg w-11 h-11 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 shadow-orange-500/40">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold text-gray-900 sm:text-lg">
                      Phone
                    </h4>
                    <p className="text-sm text-gray-600 sm:text-base">
                     +91 84369 22630
                    </p>
                  
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 shadow-lg w-11 h-11 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 shadow-orange-500/40">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold text-gray-900 sm:text-lg">
                      Email
                    </h4>
                    <p className="text-sm text-gray-600 sm:text-base">
                    bardhamanbhaktasanmilani@gmail.com
                    </p>
                 
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 shadow-lg w-11 h-11 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 shadow-orange-500/40">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold text-gray-900 sm:text-lg">
                      Address
                    </h4>
                    <p className="text-sm text-gray-600 sm:text-base">
                      R.B Chatterjee Road, Tikorhat
                      <br />
                      Bardhaman, West Bengal 713102,
                      <br />
                      India
                    </p>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="p-1 shadow-lg rounded-2xl bg-gradient-to-r from-orange-500/70 to-amber-500/70">
                <div className="overflow-hidden bg-gray-200 rounded-2xl h-52 sm:h-60">
                  <iframe
                    title="Bhakta Sanmilan Math Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14663.981320730325!2d87.8423011!3d23.243257000000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f837aa468383e5%3A0xc52f32d1cb7d0504!2sBhakta%20Sanmilan%20Math!5e0!3m2!1sen!2sin!4v1764851118712!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </motion.div>

            {/* RIGHT: form */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="flex items-center justify-center"
            >
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-md p-5 shadow-2xl bg-white/95 rounded-2xl backdrop-blur-sm sm:p-7"
              >
                <h3 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">
                  Send us a Message
                </h3>

                <div className="mb-5 text-sm text-gray-500">
                  We usually respond within{" "}
                  <span className="font-semibold text-orange-600">
                    24–48 hours.
                  </span>
                </div>

                <div className="grid gap-4 mb-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="name"
                      className="block mb-1 text-sm font-medium text-gray-700"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-1 text-sm font-medium text-gray-700"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block mb-1 text-sm font-medium text-gray-700"
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="subject"
                    className="block mb-1 text-sm font-medium text-gray-700"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    placeholder="How can we help?"
                  />
                </div>

                <div className="mb-5">
                  <label
                    htmlFor="message"
                    className="block mb-1 text-sm font-medium text-gray-700"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg resize-none focus:border-orange-500 focus:outline-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <motion.button
                  whileHover={{ scale: isSubmitting ? 1 : 1.03, y: isSubmitting ? 0 : -1 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold text-white rounded-lg shadow-lg bg-gradient-to-r from-orange-600 to-amber-600 shadow-orange-500/40 transition ${
                    isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
