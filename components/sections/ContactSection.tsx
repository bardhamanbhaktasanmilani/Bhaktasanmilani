"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Mail, Phone, MapPin, Send, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/* -------------------------------------------
 TYPES (UNCHANGED)
--------------------------------------------*/
type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type ToastState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

/* -------------------------------------------
 MAIN COMPONENT
--------------------------------------------*/
export default function ContactSection() {
  const prefersReducedMotion = useReducedMotion();
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* -------------------------------------------
   FORM STATE
  --------------------------------------------*/
  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  /* -------------------------------------------
   TOAST AUTO HIDE (OPTIMIZED)
  --------------------------------------------*/
  useEffect(() => {
    if (!toast) return;

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [toast]);

  /* -------------------------------------------
   HANDLERS (MEMOIZED)
  --------------------------------------------*/
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
          throw new Error(data.error || "Submission failed");
        }

        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });

        setToast({
          type: "success",
          message: "Your query has been submitted.",
        });
      } catch {
        setToast({
          type: "error",
          message:
            "Something went wrong. Please try again later or email us directly.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData]
  );

  /* -------------------------------------------
   RENDER
  --------------------------------------------*/
  return (
    <>
      {/* ---------------------------------
          TOAST
      ---------------------------------- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-4 right-4 z-50"
          >
            <div
              className={`flex items-start gap-3 px-4 py-3 rounded-[20px] shadow-lg border text-sm max-w-sm ${
                toast.type === "success"
                  ? "bg-green-50 border-green-200 text-green-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <span
                className={`mt-1 w-2.5 h-2.5 rounded-full ${
                  toast.type === "success"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <div className="flex-1">
                <p className="font-semibold">
                  {toast.type === "success" ? "Success" : "Oops"}
                </p>
                <p>{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="p-1 rounded-full hover:bg-black/5"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------
          SECTION
      ---------------------------------- */}
      <section
        id="contact"
        className="relative overflow-hidden py-12 sm:py-16 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
      >
        {/* Background orbs */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute w-64 h-64 bg-orange-200/60 blur-3xl -top-10 -left-10 rounded-full" />
          <div className="absolute w-64 h-64 bg-amber-300/60 blur-3xl bottom-0 right-0 rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Contact{" "}
              <span className="text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text">
                Us
              </span>
            </h2>
            <div className="w-24 h-1 mx-auto my-4 bg-gradient-to-r from-orange-600 to-amber-600" />
            <p className="max-w-2xl mx-auto text-gray-600">
              Have questions or want to get involved? We’d love to hear from you.
            </p>
          </motion.div>

          {/* Content */}
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            {/* LEFT */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-6"
            >
              {[
                {
                  icon: Phone,
                  title: "Phone",
                  text: "+91 84369 22630",
                },
                {
                  icon: Mail,
                  title: "Email",
                  text: "bardhamanbhaktasanmilani@gmail.com",
                },
                {
                  icon: MapPin,
                  title: "Address",
                  text: (
                    <>
                      R.B Chatterjee Road, Tikorhat
                      <br />
                      Bardhaman, West Bengal 713102
                    </>
                  ),
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 shadow-lg shadow-orange-500/40">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-gray-600 text-sm">{text}</p>
                  </div>
                </div>
              ))}

              {/* Map */}
              <div className="p-1 rounded-2xl bg-gradient-to-r from-orange-500/70 to-amber-500/70 shadow-lg">
                <div className="overflow-hidden rounded-2xl h-52 sm:h-60 bg-gray-200">
                  <iframe
                    title="Bhakta Sanmilan Math Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3665.985670446713!2d87.83898707588611!3d23.243608508042453!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f8363ec2137033%3A0x6a2f8d6308e7eac3!2sRB%20Chatterjee%20Rd%2C%20Raiganj%2C%20Bardhaman%2C%20West%20Bengal!5e0!3m2!1sen!2sin!4v1766492769217"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    style={{ border: 0 }}
                    allowFullScreen
                  />
                </div>
              </div>
            </motion.div>

            {/* RIGHT FORM */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <form
                onSubmit={handleSubmit}
                className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-7 max-w-md mx-auto"
              >
                <h3 className="text-xl font-bold mb-4">Send us a Message</h3>

                {[
                  { name: "name", label: "Full Name *" },
                  { name: "email", label: "Email *", type: "email" },
                  { name: "phone", label: "Phone", type: "tel" },
                  { name: "subject", label: "Subject" },
                ].map(({ name, label, type }) => (
                  <div key={name} className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      {label}
                    </label>
                    <input
                      type={type || "text"}
                      name={name}
                      value={(formData as any)[name]}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                ))}

                <div className="mb-5">
                  <label className="block text-sm font-medium mb-1">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg resize-none focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <motion.button
                  whileHover={
                    prefersReducedMotion || isSubmitting
                      ? undefined
                      : { scale: 1.03, y: -1 }
                  }
                  whileTap={
                    prefersReducedMotion || isSubmitting
                      ? undefined
                      : { scale: 0.98 }
                  }
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 shadow-lg shadow-orange-500/40 ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
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
