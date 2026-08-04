"use client"

import Link from "next/link";
import ContactForm from "./ContactForm";
import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import { motion } from "motion/react";

import { contactItems } from "@/lib/siteContent";

const ContactSection = () => {

   return (
      <section id="contact" className="w-full py-10 md:py-16 bg-zinc-50/50 dark:bg-zinc-950/30">
         <div className="max-w-7xl mx-auto px-6">
            <SectionHeader
               title="Get In Touch"
               subtitle="We are always ready to listen. Whether you have a question or want to partner with us, feel free to reach out."
            />

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
               {/* Info Cards */}
               <div className="lg:col-span-12 xl:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {contactItems.map((item, i) => (
                     <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group p-8 rounded-[2.5rem] bg-card border border-border/50 hover:border-primary/20 hover:shadow-premium transition-all duration-300"
                     >
                        <div className={`size-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                           <item.icon className="size-6" />
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight mb-2">{item.title}</h3>
                        <p className="text-muted-foreground font-medium text-sm mb-4 leading-relaxed">{item.description}</p>
                        <Link
                           href={item.href}
                           target="_blank"
                           className="text-foreground font-black text-sm hover:text-primary transition-colors flex items-center gap-2 group/link"
                        >
                           {item.value}
                        </Link>
                     </motion.div>
                  ))}
               </div>

               {/* Map and Form Split */}
               <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-sm min-h-[400px]">
                     <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117506.39803273183!2d89.47167195804562!3d22.846554558575023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ff9071032db9a3%3A0x64e0303ba70908e5!2sKhulna!5e0!3m2!1sen!2sbd!4v1712470000000!5m2!1sen!2sbd"
                        className="absolute inset-0 w-full h-full opacity-80  hover:opacity-100 transition-all duration-700"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                     />
                     <div className="absolute top-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 text-black shadow-2xl">
                        <h4 className="font-black text-xl mb-1">Our HQ</h4>
                        <p className="text-sm font-bold opacity-80">Khulna, 9100 Bangladesh</p>
                     </div>
                  </div>

                  <ContactForm />

               </div>
            </div>
         </div>
      </section>
   );
};

export default ContactSection;
