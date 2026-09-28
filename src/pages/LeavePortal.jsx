import React, { useState, useEffect, useCallback } from "react";
import { format, getDaysInMonth } from "date-fns";
import { HiOutlineCalendar, HiOutlineUserGroup } from "react-icons/hi";
import { formatTo12Hr } from "../utils/timeUtils";
import toast from "react-hot-toast";
import api from "../utils/api";
import { EmptyState, Modal, PageHeader, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useEmployeeVisibility } from "../context/EmployeeVisibilityContext";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function LeavePortal() {
  const { admin } = useAuth();
  const location = useLocation();
  const { isVisible } = useEmployeeVisibility();

  const [employees, setEmployees] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [saving, setSaving] = useState(false);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [confirmType, setConfirmType] = useState(null);
  const [permissionStartTime, setPermissionStartTime] = useState("10:00");
  const [permissionEndTime, setPermissionEndTime] = useState("12:00");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, monthsRes] = await Promise.all([
          api.get("/employees/public/list"),
          api.get("/attendance/public/months"),
        ]);
        setEmployees(empRes.data.data || []);
        const availMonths = monthsRes.data.data || [];
        setMonths(availMonths);

        if (availMonths.length > 0) {
          setSelectedPeriod(availMonths[0]);
        }
      } catch (err) {
        toast.error("Unable to load portal data");
      }
    };
    fetchData();
  }, []);

  const loadLeaves = useCallback(async () => {
    if (!selectedPeriod || !selectedEmployee) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(
        `/attendance/public/${selectedPeriod.year}/${selectedPeriod.month}/${selectedEmployee}`,
      );
      setRecords(data.data || []);
    } catch (err) {
      toast.error("Unable to load employee leaves");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedEmployee]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const handleUpdateStatus = async (status) => {
    if (!selectedPeriod || !selectedEmployee || !selectedDate) return;
    setSaving(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      await api.put(
        `/attendance/public/${selectedPeriod.year}/${selectedPeriod.month}/record`,
        {
          employeeId: selectedEmployee,
          date: dateStr,
          status: status, // 'casual_leave', 'on_duty', 'permission', or 'present' (to clear)
          permissionStartTime: status === 'permission' ? permissionStartTime : undefined,
          permissionEndTime: status === 'permission' ? permissionEndTime : undefined,
        },
      );
      toast.success(
        status === "present" ? "Leave cancelled" : "Leave submitted",
      );
      setModalOpen(false);
      loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update leave");
    } finally {
      setSaving(false);
    }
  };

  const renderCalendar = () => {
    if (!selectedPeriod) return null;

    const { year, month } = selectedPeriod;
    const startDate = new Date(year, month - 1, 1);
    const totalDays = getDaysInMonth(startDate);
    const startDayOfWeek = startDate.getDay();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="p-2 border border-transparent"
        ></div>,
      );
    }

    for (let d = 1; d <= totalDays; d++) {
      const currentDate = new Date(year, month - 1, d);
      const dateStr = format(currentDate, "yyyy-MM-dd");

      let record = records.find(
        (r) => r.date && r.date.split("T")[0] === dateStr,
      );
      // Only interested in highlighting CL and OD initially
      let bgClass =
        "bg-obsidian-900 border-gold-500/10 hover:border-gold-500/50 cursor-pointer";
      let textClass = "text-slate-600";
      let statusTag = null;

      const isSunday = currentDate.getDay() === 0;

      if (record?.status === "casual_leave") {
        bgClass =
          "bg-blue-500/90 cursor-pointer hover:bg-blue-500/80";
        textClass = "text-gold-500";
        statusTag = "CL";
      } else if (record?.status === "on_duty") {
        bgClass =
          "bg-yellow-500/90 cursor-pointer hover:bg-yellow-500/80";
        textClass = "text-sapphire-500";
        statusTag = "OD";
      } else if (record?.status === "official_leave") {
        bgClass = "bg-emerald-500/80 cursor-not-allowed";
        textClass = "text-emerald-500";
        statusTag = "OL";
      } else if (isSunday) {
        bgClass = "bg-gray-400 cursor-not-allowed";
        textClass = "text-crimson-400";
        statusTag = "WO";
      } else if (record?.status === "permission") {
        bgClass =
          "bg-orange-500/80 cursor-pointer hover:bg-orange-500/70";
        textClass = "text-amber-500";
        statusTag = "PR";
      }

      days.push(
        <div
          key={d}
          onClick={() => {
            // prevent modifying official leaves
            if (record?.status === "official_leave" || isSunday) return;
            setSelectedDate(currentDate);
            setModalOpen(true);
          }}
          className={`relative h-24 p-2 border rounded-xl flex flex-col transition-all ${bgClass}`}
        > 
        {/* ${textClass} */}
          <span className={`font-medium text-black/80`}>{d}</span>
          {statusTag && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-xl opacity-70 select-none">
              {statusTag}
            </div>
          )}
        </div>,
      );
    }

    return (
      <div className="grid grid-cols-7 gap-2 md:gap-4 mt-6">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold uppercase tracking-[0.2em] mb-2"
          >
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const years = [...new Set(months.map((m) => m.year))];

  const monthsForYear = months.filter((m) => m.year === Number(selectedYear));

  useEffect(() => {
    if (!months.length) return;

    const now = new Date();

    // sort months properly (year + month)
    const sortedMonths = [...months].sort(
      (a, b) => a.year - b.year || a.month - b.month,
    );

    // find current month
    let current = sortedMonths.find(
      (m) => m.year === now.getFullYear() && m.month === now.getMonth() + 1,
    );

    // fallback → latest month
    if (!current) {
      current = sortedMonths[sortedMonths.length - 1];
    }

    setSelectedYear(String(current.year));
    setSelectedMonth(String(current.month));
    setSelectedPeriod(current);
  }, [months]);

  return (
    <div>
      <PageHeader
        title="Leave Portal"
        subtitle="Select your name and a date to mark yourself as on Casual Leave (CL) or On Permission (PR) time."
      />

      <div className="luxury-card p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-slate-600 uppercase font-medium tracking-[0.1em] mb-2 ml-2">
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="luxury-input appearance-none w-full"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237b6d5c' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="">-- Choose Name --</option>
              {employees
                .filter((emp) => isVisible(emp.employeeId))
                .map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.firstName} {emp.lastName} [{emp.employeeId}]
                  </option>
                ))}
            </select>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-4">
              {/* Year Dropdown */}
              <div>
                <label className="block text-xs text-slate-600 uppercase font-medium tracking-[0.1em] mb-2 ml-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setSelectedMonth("");
                    setSelectedPeriod(null);
                  }}
                  className="luxury-input w-full"
                >
                  <option value="">-- Select Year --</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Dropdown */}
              <div>
                <label className="block text-xs text-slate-600 uppercase font-medium tracking-[0.1em] mb-2 ml-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    const monthVal = e.target.value;
                    setSelectedMonth(monthVal);

                    const found = months.find(
                      (m) =>
                        m.year === Number(selectedYear) &&
                        m.month === Number(monthVal),
                    );

                    if (found) setSelectedPeriod(found);
                  }}
                  className="luxury-input w-full"
                  disabled={!selectedYear}
                >
                  <option value="">-- Select Month --</option>
                  {monthsForYear.map((m) => (
                    <option key={m.month} value={m.month}>
                      {MONTHS[m.month - 1]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : !selectedEmployee ? (
        <EmptyState
          icon={HiOutlineUserGroup}
          title="Identify Yourself"
          subtitle="Please select your name from the dropdown to access your calendar."
        />
      ) : !selectedPeriod ? (
        <EmptyState
          icon={HiOutlineCalendar}
          title="No Period Available"
          subtitle="Wait for HR to initialize an attendance period before applying for leaves."
        />
      ) : (
        <div className="luxury-card p-6">
          <div className="flex items-center gap-3 border-b border-gold-500/10 pb-4">
            <HiOutlineCalendar className="w-6 h-6 text-gold-500" />
            <span className=" text-2xl text-slate-700">
              {MONTHS[selectedPeriod.month - 1]} {selectedPeriod.year}
            </span>
          </div>

          {renderCalendar()}
        </div>
      )}

      {/* Leave Update Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Manage Leave"
      >
        <div className="space-y-4">
          {selectedDate && (
            <div className="text-center py-4 bg-obsidian-900 border border-gold-500/20 rounded-xl mb-4">
              <div className="text-sm  text-slate-500 uppercase tracking-widest mb-1">
                Selected Date
              </div>
              <div className="text-lg text-gold-500">
                {format(selectedDate, "dd MMM yyyy, EEEE")}
              </div>
            </div>
          )}

          <div
            className={`grid ${admin ? "grid-cols-2" : "grid-cols-1"} gap-3`}
          >
            {/* Casual Leave (always visible) */}
            <button
              onClick={() => setConfirmType("casual_leave")}
              disabled={saving}
              className="p-4 border border-gold-500/30 rounded-xl text-center hover:bg-gold-500/10 transition-all font-semibold text-gold-500"
            >
              Casual Leave (CL)
            </button>

            {/* On Duty (admin only) */}
            {admin && (
              <button
                onClick={() => setConfirmType("on_duty")}
                disabled={saving}
                className="p-4 border border-sapphire-500/30 rounded-xl text-center hover:bg-sapphire-500/10 transition-all font-semibold text-sapphire-500"
              >
                On Duty (OD)
              </button>
            )}

            {/* Permission (always visible) */}
            <button
              onClick={() => setConfirmType("permission")}
              disabled={saving}
              className="p-4 border border-gold-500/30 rounded-xl text-center hover:bg-amber-500/10 transition-all font-semibold text-gold-500"
            >
              Permission (PR)
            </button>
          </div>
          {confirmType && (
            <div className="mt-4 p-4 border border-gold-500/20 rounded-xl text-center">
              <p className="mb-3">
                Are you sure you want to mark this as{" "}
                <strong>
                  {confirmType === "casual_leave" ? "Casual Leave" : confirmType === "on_duty" ? "On-Duty" : "Permission"}
                </strong>
                ?
              </p>

              {confirmType === "permission" && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs  text-slate-500 uppercase tracking-widest mb-1">
                      Start Time
                    </label>
                    <div className="relative group">
                      <input
                        type="time"
                        value={permissionStartTime}
                        onChange={(e) => setPermissionStartTime(e.target.value)}
                        className="luxury-input w-full"
                      />
                      {permissionStartTime && (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-gold-500 font-medium bg-obsidian-900 px-2 py-0.5 rounded border border-gold-500/20 shadow-sm pointer-events-none transition-opacity group-hover:opacity-100">
                          {formatTo12Hr(permissionStartTime)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs  text-slate-500 uppercase tracking-widest mb-1">
                      End Time
                    </label>
                    <div className="relative group">
                      <input
                        type="time"
                        value={permissionEndTime}
                        onChange={(e) => setPermissionEndTime(e.target.value)}
                        className="luxury-input w-full"
                      />
                      {permissionEndTime && (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-gold-500 font-medium bg-obsidian-900 px-2 py-0.5 rounded border border-gold-500/20 shadow-sm pointer-events-none transition-opacity group-hover:opacity-100">
                          {formatTo12Hr(permissionEndTime)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    handleUpdateStatus(confirmType);
                    setConfirmType(null);
                  }}
                  className="px-4 py-2 bg-gold-500/20 border border-gold-500 rounded-lg"
                >
                  Yes
                </button>

                <button
                  onClick={() => setConfirmType(null)}
                  className="px-4 py-2 border border-slate-500/30 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-gold-500/10 pt-4 mt-2">
            <button
              onClick={() => handleUpdateStatus("present")}
              disabled={saving}
              className="w-full p-3 bg-crimson-500/10 border border-crimson-500/20 rounded-xl text-crimson-500 hover:bg-crimson-500/20 transition-all font-semibold"
            >
              Cancel Existing Leave (Clear)
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
