import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

// Notifications (budget-threshold alerts, etc.) are a Phase 5 feature that
// isn't built yet — there's no unread count to show. Rather than leave the
// bell as inert chrome that looks broken when clicked, it opens a small
// panel that's honest about there being nothing there yet.
export default function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="text-sprout-text-muted hover:text-sprout-text transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-sprout-surface border border-sprout-border rounded-sprout shadow-sprout p-4 text-left z-20">
          <p className="text-sprout-text text-sm font-medium mb-1">No notifications yet</p>
          <p className="text-sprout-text-muted text-xs">
            Budget alerts and reminders will show up here once you set them up.
          </p>
        </div>
      )}
    </div>
  );
}