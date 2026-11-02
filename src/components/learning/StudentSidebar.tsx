import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  BookOpen,
  BarChart3,
  ClipboardCheck,
  Download,
  GraduationCap,
  House,
  LogOut,
  Settings,
  User,
  MessageSquare,
  Newspaper,
  CalendarDays,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { workspaceData } from "@/lib/learning.functions";
import { unreadClassMessages } from "@/lib/student-class";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LiberiaFlag } from "@/components/site/SiteChrome";
export function StudentSidebar({
  active = "practice",
  verificationLabel,
  aiReference = false,
  newsReference = false,
}: {
  active?: string;
  verificationLabel?: string;
  aiReference?: boolean;
  newsReference?: boolean;
}) {
  const [drawer, setDrawer] = useState(false);
  const load = useServerFn(workspaceData);
  const workspace = useQuery({
    queryKey: ["workspace"],
    queryFn: () => load(),
    retry: false,
    enabled: aiReference,
  });
  const d = workspace.data;
  const unread = d
    ? unreadClassMessages(
        d.messages,
        d.messageReads.map((r) => r.message_id),
        d.userId,
      ).length
    : 0;
  const [photo, setPhoto] = useState("");
  const [name, setName] = useState("Guest");
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    let live = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || !live) return;
      setSignedIn(true);
      const profile = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .maybeSingle();
      if (live)
        setName(profile.data?.full_name || data.user.user_metadata["full_name"] || "Student");
      const path = data.user.user_metadata["student_photo_path"];
      if (typeof path === "string" && path.startsWith(`${data.user.id}/`)) {
        const r = await supabase.storage.from("student-photos").createSignedUrl(path, 3600);
        if (live && r.data) setPhoto(r.data.signedUrl);
      }
    });
    return () => {
      live = false;
    };
  }, []);
  return (
    <>
      <Button
        variant="ghost"
        className="ai-drawer-toggle"
        aria-label={drawer ? "Close student menu" : "Open student menu"}
        aria-expanded={drawer}
        onClick={() => setDrawer(!drawer)}
      >
        {drawer ? <X size={20} /> : <Menu size={20} />}Student menu
      </Button>
      <aside className={`bl-pt-side ${drawer ? "ai-drawer-open" : ""}`} aria-label="Student menu">
        <div className="bl-pt-user">
          <span className="bl-pt-avatar">
            {photo ? <img src={photo} alt="Your profile" /> : <User size={22} />}
          </span>
          <div>
            <strong>{name}</strong>
            <span>Student</span>
            {aiReference && signedIn && (
              <small className="ai-student-online">
                <i />
                Online
              </small>
            )}
          </div>
        </div>
        {verificationLabel && (
          <span className="bl-student-verification" role="status" title={verificationLabel}>
            Verification pending
          </span>
        )}
        <nav>
          {aiReference ? (
            <>
              <Link to="/dashboard">
                <House size={22} />
                Dashboard
              </Link>
              <Link to="/my-courses">
                <BookOpen size={22} />
                My Courses
              </Link>
              <Link to="/progress">
                <BarChart3 size={22} />
                My Progress
              </Link>
              <Link to="/certificates">
                <GraduationCap size={22} />
                Certificates
              </Link>
              <Link to="/classroom" search={{ tab: "messages", classId: "" }}>
                <MessageSquare size={22} />
                Messages{unread > 0 && <span className="ai-unread">{unread}</span>}
              </Link>
              <Link to="/news" className={newsReference ? 'is-active' : ''}>
                <Newspaper size={22} />
                News &amp; Updates
              </Link>
              <Link to="/events">
                <CalendarDays size={22} />
                Events
              </Link>
              {!newsReference && <Link to="/bridgelib-ai" className="is-active">
                <Sparkles size={22} />
                BridgeLIB AI
              </Link>}
              <Link to="/settings">
                <Settings size={22} />
                Settings
              </Link>
            </>
          ) : (
            <>
              {(
                [
                  { key: "dashboard", to: "/dashboard", label: "Dashboard", Icon: House },
                  { key: "my-courses", to: "/my-courses", label: "My Courses", Icon: BookOpen },
                  {
                    key: "practice",
                    to: "/practice",
                    label: "Quizzes & Practice",
                    Icon: ClipboardCheck,
                  },
                  { key: "progress", to: "/progress", label: "My Progress", Icon: BarChart3 },
                  {
                    key: "certificates",
                    to: "/certificates",
                    label: "Certificates",
                    Icon: GraduationCap,
                  },
                  { key: "bookmarks", to: "/bookmarks", label: "Bookmarks", Icon: Bookmark },
                  { key: "downloads", to: "/downloads", label: "Downloads", Icon: Download },
                  { key: "news", to: "/news", label: "News & Updates", Icon: Newspaper },
                  { key: "events", to: "/events", label: "Events", Icon: CalendarDays },
                  {
                    key: "study-tools",
                    to: "/bridgelib-ai",
                    label: "BridgeLIB AI",
                    Icon: Sparkles,
                  },
                ] as const
              ).map(({ key, to, label, Icon }) => (
                <Link key={key} to={to} className={active === key ? "is-active" : ""}>
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
              <Link
                to="/classroom"
                search={{ tab: "messages", classId: "" }}
                className={active === "messages" ? "is-active" : ""}
              >
                <MessageSquare size={18} />
                Messages
              </Link>
              <hr />
              <Link to="/profile" className={active === "profile" ? "is-active" : ""}>
                <User size={18} />
                Profile
              </Link>
              <Link to="/settings" className={active === "settings" ? "is-active" : ""}>
                <Settings size={18} />
                Settings
              </Link>
            </>
          )}
          {signedIn ? (
            <Button
              className="bl-side-logout"
              onClick={async () => {
                await supabase.auth.signOut();
                await navigate({ to: "/" });
              }}
            >
              <LogOut size={18} />
              Logout
            </Button>
          ) : (
            <a href="/?auth=login">
              <LogOut size={18} />
              Login
            </a>
          )}
        </nav>
        <div className="bl-pt-side-card">
          <LiberiaFlag size={100} />
          <strong>
            Learn Today,
            <br />
            Build Tomorrow.
          </strong>
          {!aiReference && (
            <span>
              Better education.
              <br />A brighter Liberia.
            </span>
          )}
        </div>
      </aside>
    </>
  );
}
