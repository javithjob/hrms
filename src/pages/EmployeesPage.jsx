import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  PageHeader,
  StatCard,
  Modal,
  ConfirmDialog,
  EmptyState,
  Spinner,
  Field,
} from "../components/ui";
import {
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineFilter,
  HiOutlineEye,
  HiOutlineDownload,
} from "react-icons/hi";
import { format } from "date-fns";
import { useEmployeeVisibility } from "../context/EmployeeVisibilityContext";

const BRANCHES = ["cs1", "cs2", "cs3", "cs19", "cs21", "cs24", "cs41", "cs48"];
const DEPARTMENTS = [
  { code: "CS10", name: "Repair" },
  { code: "CS11", name: "New Product" },
  { code: "CS27", name: "Makani" },
  { code: "CS32", name: "Production" },
  { code: "CS33", name: "Business Development" },
  { code: "CS34", name: "Marketing" },
  { code: "CS35", name: "HR" },
  { code: "CS36", name: "Procurement" },
  { code: "CS37", name: "Logistics" },
  { code: "CS38", name: "IT" },
  { code: "CS39", name: "Safety & Quality" },
  { code: "CS4", name: "Finance" },
  { code: "CS5", name: "Admin" },
  { code: "CS8", name: "Installation" },
  { code: "CS9", name: "Maintenance" },
];
const CATEGORIES = ["white collar", "blue collar"];
const ENTITIES = [
  "dubai",
  "al warasan",
  "sharjah",
  "fujairah",
  "abu dhabi",
  "al ain",
  "ras al khaima",
];
const PAY_FIELDS = ["basicPay", "hra", "otherAllowance", "carAllowance"];
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;

const emptyAdmin = {
  employeeNumber: "",
  name: "",
  gender: "",
  dateOfBirth: "",
  nationality: "",
  department: "",
  designation: "",
  branch: "",
  category: "",
  entity: "",
  dateOfJoining: "",
  mobilePerson: "",
  emailPerson: "",
  mobileCompany: "",
  emailCompany: "",
  passportNumber: "",
  passportExpiry: "",
  labourCardNumber: "",
  labourCardExpiry: "",
  emiratesIdNumber: "",
  emiratesIdExpiry: "",
  insuranceStatus: "none",
  insuranceExpiry: "",
  basicPay: "",
  hra: "",
  otherAllowance: "",
  carAllowance: "",
  total: 0,
  photo: null,
  passport: null,
  visa: null,
  emiratesId: null,
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState(emptyAdmin);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const { isVisible, toggleEmployee } = useEmployeeVisibility();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/employees", {
        params: {
          search,
          department: filterDept,
          category: filterCategory,
          page,
          limit: 15,
        },
      });
      setEmployees(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [search, filterDept, filterCategory, page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const openEdit = (emp) => {
    setEditModal(emp);
    setEditForm({
      ...emptyAdmin,
      name: emp.name || "",
      gender: emp.gender || "",
      nationality: emp.nationality || "",
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split("T")[0] : "",
      emailPerson: emp.emailPerson || "",
      mobilePerson: emp.mobilePerson || "",
      employeeNumber: emp.employeeNumber || "",
      department: emp.department || "",
      designation: emp.designation || "",
      branch: emp.branch || "",
      category: emp.category || "",
      entity: emp.entity || "",
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.split("T")[0] : "",
      mobileCompany: emp.mobileCompany || "",
      emailCompany: emp.emailCompany || "",
      passportNumber: emp.passportNumber || "",
      passportExpiry: emp.passportExpiry
        ? emp.passportExpiry.split("T")[0]
        : "",
      labourCardNumber: emp.labourCardNumber || "",
      labourCardExpiry: emp.labourCardExpiry
        ? emp.labourCardExpiry.split("T")[0]
        : "",
      emiratesIdNumber: emp.emiratesIdNumber || "",
      emiratesIdExpiry: emp.emiratesIdExpiry
        ? emp.emiratesIdExpiry.split("T")[0]
        : "",
      insuranceStatus: emp.insuranceStatus || "none",
      insuranceExpiry: emp.insuranceExpiry
        ? emp.insuranceExpiry.split("T")[0]
        : "",
      basicPay: emp.basicPay ?? "",
      hra: emp.hra ?? "",
      otherAllowance: emp.otherAllowance ?? "",
      carAllowance: emp.carAllowance ?? "",
      total: emp.total || 0,
      photo: null,
      passport: null,
      visa: null,
      emiratesId: null,
    });
  };

  const updateForm = (field, value) =>
    setEditForm((current) => {
      const next = { ...current, [field]: value };
      if (PAY_FIELDS.includes(field))
        next.total = PAY_FIELDS.reduce(
          (sum, key) => sum + (Number(next[key]) || 0),
          0,
        );
      return next;
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach((key) => {
        if (editForm[key] !== null) {
          formData.append(key, editForm[key]);
        }
      });
      await api.put(`/employees/${editModal._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Employee updated");
      setEditModal(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/employees/${deleteTarget._id}`);
      toast.success("Employee removed");
      setDeleteTarget(null);
      fetch();
    } catch {
      toast.error("Delete failed");
    }
  };

  const exportAll = async () => {
    try {
      const res = await api.get('/employees/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees_all.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    }
  };

  const exportSingle = async (emp) => {
    try {
      const res = await api.get(`/employees/${emp._id}/export`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = (emp.employeeNumber || emp.name || emp._id).toString().replace(/\s+/g, '_');
      a.download = `${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${total} personnel on record`}
        action={
          <button onClick={exportAll} className="btn-ghost flex items-center gap-2 text-sm py-2 px-4">
            <HiOutlineDownload className="w-4 h-4" />
            Export All
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total"
          value={total}
          icon={HiOutlineUsers}
          accent="gold"
        />
        <StatCard
          label="White Collar"
          value={employees.filter((e) => e.category === "white collar").length}
          icon={HiOutlineUsers}
          accent="green"
        />
        <StatCard
          label="Blue Collar"
          value={employees.filter((e) => e.category === "blue collar").length}
          icon={HiOutlineUsers}
          accent="red"
        />
        <StatCard
          label="Departments"
          value={
            new Set(employees.map((e) => e.department).filter(Boolean)).size
          }
          icon={HiOutlineFilter}
          accent="blue"
        />
      </div>

      {/* Filters */}
      <div className="luxury-card p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="luxury-input !pl-9"
            placeholder="Search by name, email, ID..."
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => {
            setFilterDept(e.target.value);
            setPage(1);
          }}
          className="luxury-input w-auto min-w-[220px]"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept.code} value={dept.code}>
              {dept.code} - {dept.name}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="luxury-input w-auto min-w-[140px]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category[0].toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="luxury-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            icon={HiOutlineUsers}
            title="No employees found"
            subtitle="Try adjusting the filters or register new employees."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="luxury-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Number</th>
                  <th>Department</th>
                  <th>Branch</th>
                  <th>Category</th>
                  <th>Total Pay</th>
                  <th>Joined</th>
                  <th
                    className="!w-12 !text-center"
                    title="Toggle visibility in dropdowns (Attendance / Payroll / CL Registry)"
                  >
                    Payroll
                  </th>
                  <th className="!text-right !pr-8">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...employees]
                  .sort((a, b) =>
                    (a.employeeNumber || "")
                      .toString()
                      .localeCompare((b.employeeNumber || "").toString()),
                  )
                  .map((emp) => {
                    const empId = emp.employeeNumber;
                    const checked = isVisible(empId);
                    const initials = (emp.name || "")
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <tr key={emp._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-obsidian-600 border border-gold-500/20">
                              {emp.photo ? (
                                <img
                                  src={`${UPLOADS_URL}/employees/${emp.photo}`}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gold-400 text-sm">
                                  {initials}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-slate-700 font-medium">
                                {emp.name}
                              </div>
                              <div className="text-slate-500 text-xs">
                                {emp.emailPerson || emp.emailCompany || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className=" text-gold-500 text-xs">
                            {emp.employeeId || emp.employeeNumber || "—"}
                          </span>
                        </td>
                        <td>
                          <span className="text-slate-600">
                            {emp.department || "—"}
                          </span>
                        </td>
                        <td>
                          <span className="text-slate-600">
                            {emp.branch?.toUpperCase() || "—"}
                          </span>
                        </td>
                        <td>
                          <span className={emp.category === "white collar" ? "badge-active" : "badge-inactive"}>
                            {emp.category || "—"}
                          </span>
                        </td>
                        <td>
                          <span className=" text-slate-600 text-xs">
                            {Number(emp.total || 0).toLocaleString("en-IN")} AED
                          </span>
                        </td>
                        <td>
                          <span className="text-slate-500 text-xs">
                            {emp.dateOfJoining
                              ? format(
                                  new Date(emp.dateOfJoining),
                                  "dd MMM yyyy",
                                )
                              : "—"}
                          </span>
                        </td>
                        <td className="!text-center !w-12">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEmployee(empId)}
                            className="w-4 h-4 rounded accent-gold-500 cursor-pointer"
                            title={
                              checked
                                ? "Hide from dropdowns"
                                : "Show in dropdowns"
                            }
                          />
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewModal(emp)}
                              className="p-2 text-slate-400 hover:text-sapphire-400 hover:bg-sapphire-500/10 rounded-lg transition-all"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => exportSingle(emp)}
                              className="p-2 text-slate-400 hover:text-sapphire-400 hover:bg-sapphire-500/10 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <HiOutlineDownload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(emp)}
                              className="p-2 text-slate-400 hover:text-gold-400 hover:bg-gold-500/10 rounded-lg transition-all"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(emp)}
                              className="p-2 text-slate-400 hover:text-crimson-400 hover:bg-crimson-500/10 rounded-lg transition-all"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gold-500/10">
            <span className="text-slate-400 text-xs ">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal
        open={!!viewModal}
        onClose={() => setViewModal(null)}
        title="Employee Details"
        size="lg"
      >
        {viewModal && (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-obsidian-600 border border-gold-500/20">
                {viewModal.photo ? (
                  <img
                    src={`${UPLOADS_URL}/employees/${viewModal.photo}`}
                    alt=""
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold-400 text-2xl">
                    {(viewModal.name || "")
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl text-slate-700">{viewModal.name}</h2>
                <div className=" text-gold-400 text-sm">
                  {viewModal.employeeNumber || "ID Pending"}
                </div>
                <span
                  className={
                    viewModal.category === "white collar"
                      ? "badge-active"
                      : "badge-inactive"
                  }
                >
                  {viewModal.category || "—"}
                </span>
              </div>
            </div>
            <div className="gold-line" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Email (Personal)", viewModal.emailPerson || "—"],
                ["Mobile (Personal)", viewModal.mobilePerson || "—"],
                [
                  "Date of Birth",
                  viewModal.dateOfBirth
                    ? format(new Date(viewModal.dateOfBirth), "dd MMM yyyy")
                    : "—",
                ],
                ["Nationality", viewModal.nationality || "—"],
                ["Department", viewModal.department || "—"],
                ["Designation", viewModal.designation || "—"],
                [
                  "Salary",
                  viewModal.salary
                    ? `AED ${Number(viewModal.salary).toLocaleString("en-IN")}`
                    : "—",
                ],
                [
                  "D.O.J.",
                  viewModal.dateOfJoining
                    ? format(new Date(viewModal.dateOfJoining), "dd MMM yyyy")
                    : "—",
                ],
                ["Branch", viewModal.branch?.toUpperCase() || "—"],
                ["Category", viewModal.category || "—"],
                ["Entity", viewModal.entity || "—"],
                ["Mobile (Company)", viewModal.mobileCompany || "—"],
                ["Email (Company)", viewModal.emailCompany || "—"],
                ["Passport Number", viewModal.passportNumber || "—"],
                [
                  "Passport Expiry",
                  viewModal.passportExpiry
                    ? format(new Date(viewModal.passportExpiry), "dd MMM yyyy")
                    : "—",
                ],
                ["Labour Card Number", viewModal.labourCardNumber || "—"],
                [
                  "Labour Card Expiry",
                  viewModal.labourCardExpiry
                    ? format(
                        new Date(viewModal.labourCardExpiry),
                        "dd MMM yyyy",
                      )
                    : "—",
                ],
                ["Emirates ID Number", viewModal.emiratesIdNumber || "—"],
                [
                  "Emirates ID Expiry",
                  viewModal.emiratesIdExpiry
                    ? format(
                        new Date(viewModal.emiratesIdExpiry),
                        "dd MMM yyyy",
                      )
                    : "—",
                ],
                ["Insurance Status", viewModal.insuranceStatus || "—"],
                [
                  "Insurance Expiry",
                  viewModal.insuranceExpiry
                    ? format(new Date(viewModal.insuranceExpiry), "dd MMM yyyy")
                    : "—",
                ],
                [
                  "Basic Pay",
                  `${Number(viewModal.basicPay || 0).toLocaleString("en-IN")} AED`,
                ],
                [
                  "HRA",
                  `${Number(viewModal.hra || 0).toLocaleString("en-IN")} AED`,
                ],
                [
                  "Other Allowance",
                  `${Number(viewModal.otherAllowance || 0).toLocaleString("en-IN")} AED`,
                ],
                [
                  "Car Allowance",
                  `${Number(viewModal.carAllowance || 0).toLocaleString("en-IN")} AED`,
                ],
                [
                  "Total",
                  `${Number(viewModal.total || 0).toLocaleString("en-IN")} AED`,
                ],
              ]
                .filter(([k]) => k !== "Salary")
                .map(([k, v]) => (
                  <div key={k}>
                    <span className="text-xs  text-slate-500 uppercase tracking-wider">
                      {k}
                    </span>
                    <div className="text-slate-800 mt-0.5">{v}</div>
                  </div>
                ))}
            </div>
            {viewModal.passport && (
              <a
                href={`${UPLOADS_URL}/employees/${viewModal.passport}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-gold-500 text-sm hover:text-gold-600 underline underline-offset-2"
              >
                View Passport
              </a>
            )}
            {viewModal.passport && (
              <a
                href={`${import.meta.env.VITE_API_URL}/employees/download/${viewModal.passport}`}
                className="text-gold-500 text-sm hover:text-gold-600 underline ml-4"
              >
                Download Passport
              </a>
            )}
            {viewModal.visa && (
              <a
                href={`${import.meta.env.VITE_API_URL}/employees/download/${viewModal.visa}`}
                className="text-gold-500 text-sm hover:text-gold-600 underline ml-4"
              >
                Download Visa
              </a>
            )}
            {viewModal.emiratesId && (
              <a
                href={`${import.meta.env.VITE_API_URL}/employees/download/${viewModal.emiratesId}`}
                className="text-gold-500 text-sm hover:text-gold-600 underline ml-4"
              >
                Download Emirates ID
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title="Edit Employee"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h4 className="col-span-full text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-gold-500/10 pb-2">
              Personal Information
            </h4>
            <Field label="Employee Number">
              <input
                value={editForm.employeeNumber}
                onChange={(e) => updateForm("employeeNumber", e.target.value)}
                className="luxury-input"
                placeholder="EMP0001"
              />
            </Field>
            <Field label="Name">
              <input
                value={editForm.name}
                onChange={(e) => updateForm("name", e.target.value)}
                className="luxury-input"
                placeholder="John Doe"
              />
            </Field>
            <Field label="Gender">
              <select
                value={editForm.gender}
                onChange={(e) => updateForm("gender", e.target.value)}
                className="luxury-input"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Nationality">
              <input
                value={editForm.nationality}
                onChange={(e) => updateForm("nationality", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Email (Personal)">
              <input
                type="email"
                value={editForm.emailPerson}
                onChange={(e) =>
                  setEditForm({ ...editForm, emailPerson: e.target.value })
                }
                className="luxury-input"
                placeholder="john.doe@example.com"
              />
            </Field>
            <Field label="Mobile (Personal)">
              <input
                value={editForm.mobilePerson}
                onChange={(e) =>
                  setEditForm({ ...editForm, mobilePerson: e.target.value })
                }
                className="luxury-input"
                placeholder="+91 98765 43210"
              />
            </Field>
            <Field label="Date of Birth">
              <input
                type="date"
                value={editForm.dateOfBirth}
                onChange={(e) =>
                  setEditForm({ ...editForm, dateOfBirth: e.target.value })
                }
                className="luxury-input"
              />
            </Field>
            <Field label="Mobile (Company)">
              <input
                value={editForm.mobileCompany}
                onChange={(e) => updateForm("mobileCompany", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Email (Company)">
              <input
                type="email"
                value={editForm.emailCompany}
                onChange={(e) => updateForm("emailCompany", e.target.value)}
                className="luxury-input"
              />
            </Field>

            <h4 className="col-span-full text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-gold-500/10 pb-2 mt-4">
              Administrative Details
            </h4>
            <Field label="Department">
              <select
                value={editForm.department}
                onChange={(e) =>
                  setEditForm({ ...editForm, department: e.target.value })
                }
                className="luxury-input"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.code} value={dept.code}>
                    {dept.code} - {dept.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Designation">
              <input
                value={editForm.designation}
                onChange={(e) =>
                  setEditForm({ ...editForm, designation: e.target.value })
                }
                className="luxury-input"
                placeholder="Software Engineer"
              />
            </Field>
            <Field label="Branch">
              <select
                value={editForm.branch}
                onChange={(e) =>
                  setEditForm({ ...editForm, branch: e.target.value })
                }
                className="luxury-input"
              >
                <option value="">Select branch</option>
                {["cs1", "cs2", "cs3", "cs19", "cs41", "cs48"].map((branch) => (
                  <option key={branch} value={branch}>
                    {branch.toUpperCase()}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
                className="luxury-input"
              >
                <option value="">Select category</option>
                <option value="white collar">White Collar</option>
                <option value="blue collar">Blue Collar</option>
              </select>
            </Field>
            <Field label="Entity">
              <select
                value={editForm.entity}
                onChange={(e) =>
                  setEditForm({ ...editForm, entity: e.target.value })
                }
                className="luxury-input"
              >
                <option value="">Select entity</option>
                {[
                  "dubai",
                  "al warasan",
                  "sharjah",
                  "fujairah",
                  "abu dhabi",
                  "al ain",
                  "ras al khaima",
                ].map((entity) => (
                  <option key={entity} value={entity}>
                    {entity
                      .split(" ")
                      .map((word) => word[0].toUpperCase() + word.slice(1))
                      .join(" ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="D.O.J.">
              <input
                type="date"
                value={editForm.dateOfJoining}
                onChange={(e) =>
                  setEditForm({ ...editForm, dateOfJoining: e.target.value })
                }
                className="luxury-input"
              />
            </Field>
            <h4 className="col-span-full text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-gold-500/10 pb-2 mt-4">
              Compliance & Insurance
            </h4>
            <Field label="Passport Number">
              <input
                value={editForm.passportNumber}
                onChange={(e) => updateForm("passportNumber", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Passport Expiry">
              <input
                type="date"
                value={editForm.passportExpiry}
                onChange={(e) => updateForm("passportExpiry", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Labour Card Number">
              <input
                value={editForm.labourCardNumber}
                onChange={(e) => updateForm("labourCardNumber", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Labour Card Expiry">
              <input
                type="date"
                value={editForm.labourCardExpiry}
                onChange={(e) => updateForm("labourCardExpiry", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Emirates ID Number">
              <input
                value={editForm.emiratesIdNumber}
                onChange={(e) => updateForm("emiratesIdNumber", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Emirates ID Expiry">
              <input
                type="date"
                value={editForm.emiratesIdExpiry}
                onChange={(e) => updateForm("emiratesIdExpiry", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Insurance Status">
              <select
                value={editForm.insuranceStatus}
                onChange={(e) => updateForm("insuranceStatus", e.target.value)}
                className="luxury-input"
              >
                <option value="none">None</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Insurance Expiry">
              <input
                type="date"
                value={editForm.insuranceExpiry}
                onChange={(e) => updateForm("insuranceExpiry", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <h4 className="col-span-full text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-gold-500/10 pb-2 mt-4">
              Salary Structure
            </h4>
            <Field label="Basic Pay">
              <input
                type="number"
                min="0"
                value={editForm.basicPay}
                onChange={(e) => updateForm("basicPay", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="HRA">
              <input
                type="number"
                min="0"
                value={editForm.hra}
                onChange={(e) => updateForm("hra", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Other Allowance">
              <input
                type="number"
                min="0"
                value={editForm.otherAllowance}
                onChange={(e) => updateForm("otherAllowance", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Car Allowance">
              <input
                type="number"
                min="0"
                value={editForm.carAllowance}
                onChange={(e) => updateForm("carAllowance", e.target.value)}
                className="luxury-input"
              />
            </Field>
            <Field label="Total">
              <input
                value={`${Number(editForm.total || 0).toLocaleString("en-IN")} AED`}
                className="luxury-input"
                readOnly
              />
            </Field>

            <h4 className="col-span-full text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-gold-500/10 pb-2 mt-4">
              Document Uploads
            </h4>
            <Field label="Photo (Leave empty to keep existing)">
              <input
                type="file"
                onChange={(e) =>
                  setEditForm({ ...editForm, photo: e.target.files[0] })
                }
                className="luxury-input py-1"
                accept=".jpg,.jpeg,.png"
              />
            </Field>
            <Field label="Passport (Leave empty to keep existing)">
              <input
                type="file"
                onChange={(e) =>
                  setEditForm({ ...editForm, passport: e.target.files[0] })
                }
                className="luxury-input py-1"
                accept=".pdf,application/pdf"
              />
            </Field>
            <Field label="Visa (Leave empty to keep existing)">
              <input
                type="file"
                onChange={(e) =>
                  setEditForm({ ...editForm, visa: e.target.files[0] })
                }
                className="luxury-input py-1"
                accept=".pdf,application/pdf"
              />
            </Field>
            <Field label="Emirates ID (Leave empty to keep existing)">
              <input
                type="file"
                onChange={(e) =>
                  setEditForm({ ...editForm, emiratesId: e.target.files[0] })
                }
                className="luxury-input py-1"
                accept=".pdf,application/pdf"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gold-500/10">
            <button
              onClick={() => setEditModal(null)}
              className="btn-ghost px-6"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-gold px-12"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Employee"
        message={`Are you sure you want to remove ${deleteTarget?.name || ""}? This action cannot be undone.`}
        danger
      />
    </div>
  );
}
