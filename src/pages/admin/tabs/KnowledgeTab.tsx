import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, HelpCircle, AlertTriangle, CalendarDays, Users, Scissors } from 'lucide-react';

export default function KnowledgeTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="bg-surface-container border border-outline-variant/10 p-8">
        <div className="flex items-center gap-4 mb-6">
          <BookOpen className="text-primary" size={28} />
          <h2 className="font-headline text-3xl font-bold uppercase tracking-tighter">Knowledge Base</h2>
        </div>
        <p className="text-on-surface-variant font-body text-sm leading-relaxed max-w-3xl">
          Welcome to the Ace Of Fades Operations Manual. This guide is designed to help you navigate the administrative portal, manage the studio's daily workflow, and troubleshoot common scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Walkthroughs */}
        <div className="space-y-6">
          <h3 className="font-headline text-xl font-bold uppercase tracking-widest text-primary border-b border-outline-variant/10 pb-2">
            Feature Walkthrough
          </h3>

          <div className="bg-surface-container border border-outline-variant/10 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-on-surface">
              <CalendarDays size={20} className="text-primary" />
              <h4 className="font-headline font-bold uppercase tracking-wider text-sm">Appointments & Calendar</h4>
            </div>
            <ul className="list-disc list-inside text-sm text-on-surface-variant space-y-2 font-body">
              <li><strong>List View:</strong> See all bookings. Use filters to find specific appointments or manage statuses (e.g., mark as No-Show).</li>
              <li><strong>Calendar View:</strong> A visual grid of the month. Click any date to jump to availability for that day.</li>
              <li><strong>Manual Booking:</strong> Use the "Add Booking" button at the top to schedule appointments for walk-ins or call-ins.</li>
            </ul>
          </div>

          <div className="bg-surface-container border border-outline-variant/10 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-on-surface">
              <HelpCircle size={20} className="text-primary" />
              <h4 className="font-headline font-bold uppercase tracking-wider text-sm">Managing Availability</h4>
            </div>
            <ul className="list-disc list-inside text-sm text-on-surface-variant space-y-2 font-body">
              <li>Go to <strong>Availability</strong> (Clock icon) or click a date on the Calendar.</li>
              <li>Toggle specific time slots to block/unblock them for a chosen day.</li>
              <li>Use the <strong>Block Full Day</strong> button to instantly close the schedule for holidays or emergencies.</li>
            </ul>
          </div>

          <div className="bg-surface-container border border-outline-variant/10 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-on-surface">
              <Users size={20} className="text-primary" />
              <h4 className="font-headline font-bold uppercase tracking-wider text-sm">Client Management</h4>
            </div>
            <p className="text-sm text-on-surface-variant font-body mb-2">
              The Clients tab lists everyone who has ever booked or registered.
            </p>
            <ul className="list-disc list-inside text-sm text-on-surface-variant space-y-2 font-body">
              <li><strong>Suspend/Reactivate:</strong> Temporarily block problematic clients from booking online.</li>
              <li><strong>Delete:</strong> Completely purges a client record (use with caution).</li>
            </ul>
          </div>

          <div className="bg-surface-container border border-outline-variant/10 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-on-surface">
              <Scissors size={20} className="text-primary" />
              <h4 className="font-headline font-bold uppercase tracking-wider text-sm">Services Menu</h4>
            </div>
            <p className="text-sm text-on-surface-variant font-body">
              Add, edit, or remove services from the <strong>Services</strong> tab. Changes here directly affect what clients see on the public booking page. Ensure descriptions and prices are accurate.
            </p>
          </div>
        </div>

        {/* Troubleshooting & Tech Support */}
        <div className="space-y-6">
          <h3 className="font-headline text-xl font-bold uppercase tracking-widest text-primary border-b border-outline-variant/10 pb-2 flex items-center gap-2">
            <AlertTriangle size={20} /> Troubleshooting
          </h3>

          <div className="bg-surface-container border border-outline-variant/10 p-6 mb-4">
             <h4 className="font-headline font-bold uppercase text-sm mb-2">"Clients can't see the 2:00 PM slot"</h4>
             <p className="text-sm text-on-surface-variant mb-2">If a specific time slot is missing from the public booking page, check the following in order:</p>
             <ol className="list-decimal list-inside text-sm text-on-surface-variant space-y-1">
               <li>Is there already an active booking for that time? (Check <strong>Appointments</strong>).</li>
               <li>Did someone manually block that time? (Check <strong>Availability</strong> for that date).</li>
               <li>Is the shop closing early that day? (Check <strong>Settings &gt; Special Date Overrides</strong>).</li>
             </ol>
          </div>

          <div className="bg-surface-container border border-outline-variant/10 p-6 mb-4">
             <h4 className="font-headline font-bold uppercase text-sm mb-2">"A new service isn't showing up"</h4>
             <p className="text-sm text-on-surface-variant">
               Go to the <strong>Services</strong> tab and ensure the service was actually created and saved. If the UI still doesn't reflect it, try clicking the "Sync Data" (refresh arrows) button at the top right of the Admin Portal.
             </p>
          </div>

          <div className="bg-surface-container border border-outline-variant/10 p-6 mb-4 border-l-4 border-l-[#D94F4F]">
             <h4 className="font-headline font-bold uppercase text-sm mb-2 text-[#D94F4F]">"The shop appears closed on a normal day"</h4>
             <p className="text-sm text-on-surface-variant">
               Check the <strong>Settings</strong> tab. Ensure regular Weekly Hours are set correctly for that day of the week, and verify that there isn't a "Full Day Block" Special Date Override mistakenly applied to that date.
             </p>
          </div>

          <div className="mt-8 p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-center">
            <h4 className="font-headline font-bold uppercase tracking-wide text-primary mb-2">Need Technical Support?</h4>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest leading-relaxed">
              For issues not covered here, database errors, or systemic outages, contact the development team at:<br/>
              <a href="mailto:admin@offgridmediagroup.com" className="text-primary hover:underline font-bold mt-2 inline-block">admin@offgridmediagroup.com</a>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
