"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FormEvent,
} from "react";
import { Mail, Phone, MapPin, Send, X } from "lucide-react";

export const metadata = {
  title: "Contact Us – Get in Touch",
  description:
    "Contact Bhakta Sanmilani Temple for donation support, puja inquiries, events, or general assistance.",
};

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

export default function ContactSection() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setPrefersReducedMotion(false);
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setPrefersReducedMotion(Boolean(mq.matches));
    handler();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      // older Safari fallback
      // @ts-ignore
      mq.addListener(handler);
      // @ts-ignore
      return () => mq.removeListener(handler);
    }
  }, []);

  const toastTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const submitInFlightRef = useRef(false);

  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [visible, setVisible] = useState(false); // used for light entrance

  useEffect(() => {
    mountedRef.current = true;
    const t = window.setTimeout(() => setVisible(true), 40);
    return () => {
      mountedRef.current = false;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);

    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [toast]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      submitInFlightRef.current = false;
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const validateEmail = (s: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (submitInFlightRef.current) return;

      if (!formData.name || !formData.email || !formData.message) {
        setToast({
          type: "error",
          message: "Please fill in your name, email and message.",
        });
        return;
      }

      if (!validateEmail(formData.email)) {
        setToast({
          type: "error",
          message: "Please enter a valid email address.",
        });
        return;
      }

      const controller = new AbortController();
      submitInFlightRef.current = true;
      setIsSubmitting(true);

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          signal: controller.signal,
        });

        // if request aborted, throw to outer catch
        if (controller.signal.aborted) throw new Error("aborted");

        let data: any = {};
        try {
          data = await res.json();
        } catch {
          // non-json response
        }

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Submission failed");
        }

        if (!mountedRef.current) return;

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
      } catch (err) {
        if (!mountedRef.current) return;
        setToast({
          type: "error",
          message:
            "Something went wrong. Please try again later or email us directly.",
        });
      } finally {
        submitInFlightRef.current = false;
        if (mountedRef.current) setIsSubmitting(false);
      }

      // ensure we abort if the component unmounts before fetch resolves
      return () => controller.abort();
    },
    [formData]
  );

  const dismissToast = useCallback(() => {
    setToast(null);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  return (
    <>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 transform transition-all ${
            prefersReducedMotion ? "transition-none" : "duration-200"
          } ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          style={{
            minWidth: 280,
            /* respect iPhone safe area */
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          <div
            className={`flex items-start gap-3 px-4 py-3 rounded-[16px] border text-sm shadow-sm ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <span
              aria-hidden
              className={`mt-1 w-2.5 h-2.5 rounded-full ${
                toast.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <div className="flex-1">
              <p className="font-semibold">
                {toast.type === "success" ? "Success" : "Oops"}
              </p>
              <p>{toast.message}</p>
            </div>
            <button
              onClick={dismissToast}
              className="p-1 rounded-full hover:bg-black/5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <section
        id="contact"
        className="relative overflow-hidden py-12 sm:py-16 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
      >
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div
            className="absolute -top-8 -left-8 w-44 h-44 rounded-full opacity-60"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(251,146,60,0.45), rgba(251,146,60,0.12) 40%, transparent 60%)",
              filter: "blur(18px)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-44 h-44 rounded-full opacity-50"
            style={{
              background:
                "radial-gradient(circle at 80% 80%, rgba(245,158,11,0.35), rgba(245,158,11,0.08) 38%, transparent 62%)",
              filter: "blur(18px)",
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <div
            className={`text-center mb-10 transform transition-all ${
              prefersReducedMotion ? "transition-none" : "duration-400"
            } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
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
          </div>

          {/* Content grid */}
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            {/* LEFT (contact info + map) */}
            <div
              className={`space-y-6 transform transition-all ${
                prefersReducedMotion ? "transition-none" : "duration-400 delay-75"
              } ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}`}
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
                  <div
                    className="w-11 h-11 flex items-center justify-center rounded-xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(249,115,22,0.95), rgba(245,158,11,0.95))",
                      boxShadow: "0 6px 18px rgba(249,115,22,0.12)",
                    }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-gray-600 text-sm">{text}</p>
                  </div>
                </div>
              ))}

              {/* Map */}
              <div
                className="p-1 rounded-2xl"
                style={{
                  background: "linear-gradient(90deg, rgba(249,115,22,0.08), rgba(245,158,11,0.06))",
                }}
              >
                <div className="overflow-hidden rounded-2xl h-52 sm:h-60 bg-gray-100">
                  <iframe
                    title="Bhakta Sanmilan Math Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3665.985670446713!2d87.83898707588611!3d23.243608508042453!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f8363ec2137033%3A0x6a2f8d6308e7eac3!2sRB%20Chatterjee%20Rd%2C%20Raiganj%2C%20Bardhaman%2C%20West%20Bengal!5e0!3m2!1sen!2sin!4v1766492769217"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    style={{ border: 0 }}
                    allowFullScreen
                    aria-hidden={false}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT FORM */}
            <div
              className={`transform transition-all ${
                prefersReducedMotion ? "transition-none" : "duration-400 delay-100"
              } ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3"}`}
            >
              <form
                onSubmit={handleSubmit}
                className="bg-white/95 rounded-2xl p-6 sm:p-7 max-w-md mx-auto"
                aria-labelledby="contact-form-heading"
                aria-busy={isSubmitting}
              >
                <h3 id="contact-form-heading" className="text-xl font-bold mb-4">
                  Send us a Message
                </h3>

                {[
                  { name: "name", label: "Full Name *" },
                  { name: "email", label: "Email *", type: "email" },
                  { name: "phone", label: "Phone", type: "tel" },
                  { name: "subject", label: "Subject" },
                ].map(({ name, label, type }) => (
                  <div key={name} className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor={name}>
                      {label}
                    </label>
                    <input
                      id={name}
                      type={type || "text"}
                      name={name}
                      value={(formData as any)[name]}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-base"
                      // text-base ensures 16px to avoid iOS auto-zoom on focus
                      inputMode={name === "phone" ? "tel" : undefined}
                    />
                  </div>
                ))}

                <div className="mb-5">
                  <label className="block text-sm font-medium mb-1" htmlFor="message">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg resize-none focus:border-orange-500 focus:outline-none text-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-disabled={isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  style={{
                    background: "linear-gradient(90deg, #F97316, #F59E0B)",
                    boxShadow: "0 10px 24px rgba(249,115,22,0.12)",
                    transition: prefersReducedMotion ? "none" : "transform 180ms ease, box-shadow 180ms ease",
                  }}
                  onTouchStart={() => {
                    /* cheap native-feel feedback on touch devices */
                    if (!prefersReducedMotion && !isSubmitting) {
                      // no heavy DOM writes here
                    }
                  }}
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
