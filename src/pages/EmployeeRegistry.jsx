import React, { useState, useRef } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Field } from "../components/ui";
import {
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlinePhotograph,
} from "react-icons/hi";

function FileUploadBox({ label, name, accept, file, onChange, icon: Icon }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onChange({ target: { name, files: [f] } });
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 
        ${drag ? "drag-over" : "border-gold-500/20 hover:border-gold-500/40"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => ref.current.click()}
    >
      <input
        ref={ref}
        type="file"
        name={name}
        accept={accept}
        className="hidden"
        onChange={onChange}
      />
      {file ? (
        <div className="flex items-center justify-center gap-2 text-emerald-400">
          <HiOutlineCheckCircle className="w-5 h-5" />
          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
        </div>
      ) : (
        <div className="space-y-2">
          <Icon className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-slate-500 text-sm">{label}</div>
          <div className="text-slate-400 text-xs">
            Drag & drop or click — Max 10MB
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeeRegistry() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Personal
    employeeNumber: "",
    name: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    // Employment
    department: "",
    designation: "",
    branch: "",
    category: "",
    entity: "",
    dateOfJoining: "",
    // Contact
    mobilePerson: "",
    emailPerson: "",
    mobileCompany: "",
    emailCompany: "",
    // Compliance
    passportNumber: "",
    passportExpiry: "",
    labourCardNumber: "",
    labourCardExpiry: "",
    emiratesIdNumber: "",
    emiratesIdExpiry: "",
    insuranceStatus: "",
    insuranceExpiry: "",
  });
  const [files, setFiles] = useState({
    photo: null,
    passport: null,
    visa: null,
    emiratesId: null,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleFile = (e) => {
    const { name, files: f } = e.target;
    if (f[0] && f[0].size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    const isPhoto = name === "photo";
    const isValid = isPhoto
      ? ["image/jpeg", "image/png"].includes(f[0]?.type)
      : f[0]?.type === "application/pdf";
    if (f[0] && !isValid) {
      toast.error(
        isPhoto
          ? "Photo must be a JPG or PNG image"
          : "This document must be a PDF",
      );
      return;
    }
    setFiles((prev) => ({ ...prev, [name]: f[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (files.photo) fd.append("photo", files.photo);
      if (files.passport) fd.append("passport", files.passport);
      if (files.visa) fd.append("visa", files.visa);
      if (files.emiratesId) fd.append("emiratesId", files.emiratesId);
      await api.post("/employees/register", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success)
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="luxury-card p-12 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <HiOutlineCheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className=" text-3xl text-slate-700 mb-3">
            Registration Complete
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Your details have been submitted. The admin will review and assign
            your employee ID.
          </p>
          <button
            className="btn-gold px-8 py-3"
            onClick={() => {
              setSuccess(false);
              setForm({
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
              });
              setFiles({
                photo: null,
                passport: null,
                visa: null,
                emiratesId: null,
              });
            }}
          >
            Register Another
          </button>
        </div>
      </div>
    );

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-1 h-8 rounded-full"
            style={{ background: "linear-gradient(180deg, #d4a833, #f5d98b)" }}
          />
          <h1 className=" text-4xl text-slate-700">Employee Registry</h1>
        </div>
        <p className="text-slate-500 text-sm ml-4">
          Complete your profile to contribute to the organisation
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="luxury-card p-6 mb-5">
            <h2 className=" text-lg text-slate-800 mb-5 flex items-center gap-2">
              <span className="text-xs text-slate-800 bg-obsidian-700 px-2 py-1 rounded">
                01
              </span>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Employee Number">
                <input
                  name="employeeNumber"
                  value={form.employeeNumber}
                  onChange={handleChange}
                  className="luxury-input"
                  placeholder="M001"
                />
              </Field>
              <Field label="Name" required>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="luxury-input"
                  placeholder="John Doe"
                  required
                />
              </Field>
              <Field label="Gender">
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="luxury-input"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="D.O.B.">
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Nationality">
                <input
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                  className="luxury-input"
                  placeholder="Nationality"
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={next}
                className="btn-gold px-6 py-2"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Employment Information */}
        {step === 2 && (
          <div className="luxury-card p-6 mb-5">
            <h2 className=" text-lg text-slate-800 mb-5 flex items-center gap-2">
              <span className="text-xs  text-slate-800 bg-obsidian-700 px-2 py-1 rounded">
                02
              </span>
              Employment Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Department">
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="luxury-input"
                >
                  <option value="">Select department</option>
                  <option value="CS10">CS10 - Repair</option>
                  <option value="CS11">CS11 - New Product</option>
                  <option value="CS27">CS27 - Makani</option>
                  <option value="CS32">CS32 - Production</option>
                  <option value="CS33">CS33 - Business Development</option>
                  <option value="CS34">CS34 - Marketing</option>
                  <option value="CS35">CS35 - HR</option>
                  <option value="CS36">CS36 - Procurement</option>
                  <option value="CS37">CS37 - Logistics</option>
                  <option value="CS38">CS38 - IT</option>
                  <option value="CS39">CS39 - Safety & Quality</option>
                  <option value="CS4">CS4 - Finance</option>
                  <option value="CS5">CS5 - Admin</option>
                  <option value="CS8">CS8 - Installation</option>
                  <option value="CS9">CS9 - Maintenance</option>
                </select>
              </Field>
              <Field label="Designation">
                <input
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Branch">
                <select
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  className="luxury-input"
                >
                  <option value="">Select branch</option>
                  {[
                    "cs1",
                    "cs2",
                    "cs3",
                    "cs19",
                    "cs21",
                    "cs24",
                    "cs41",
                    "cs48",
                  ].map((branch) => (
                    <option key={branch} value={branch}>
                      {branch.toUpperCase()}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="luxury-input"
                >
                  <option value="">Select category</option>
                  <option value="white collar">White Collar</option>
                  <option value="blue collar">Blue Collar</option>
                </select>
              </Field>
              <Field label="Entity">
                <select
                  name="entity"
                  value={form.entity}
                  onChange={handleChange}
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
                  name="dateOfJoining"
                  type="date"
                  value={form.dateOfJoining}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
            </div>
            <div className="flex justify-between gap-2 mt-6">
              <button
                type="button"
                onClick={prev}
                className="btn-outline px-6 py-2"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={next}
                className="btn-gold px-6 py-2"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Information */}
        {step === 3 && (
          <div className="luxury-card p-6 mb-5">
            <h2 className=" text-lg text-slate-800 mb-5 flex items-center gap-2">
              <span className="text-xs  text-slate-800 bg-obsidian-700 px-2 py-1 rounded">
                03
              </span>
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Mobile Number (Person)">
                <input
                  name="mobilePerson"
                  value={form.mobilePerson}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Email (Person)">
                <input
                  name="emailPerson"
                  type="email"
                  value={form.emailPerson}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Mobile Number (Company)">
                <input
                  name="mobileCompany"
                  value={form.mobileCompany}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Email (Company)">
                <input
                  name="emailCompany"
                  type="email"
                  value={form.emailCompany}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
            </div>
            <div className="flex justify-between gap-2 mt-6">
              <button
                type="button"
                onClick={prev}
                className="btn-outline px-6 py-2"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={next}
                className="btn-gold px-6 py-2"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Compliance & Insurance */}
        {step === 4 && (
          <div className="luxury-card p-6 mb-5">
            <h2 className=" text-lg text-slate-800 mb-5 flex items-center gap-2">
              <span className="text-xs  text-slate-800 bg-obsidian-700 px-2 py-1 rounded">
                04
              </span>
              Compliance & Insurance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Passport Number">
                <input
                  name="passportNumber"
                  value={form.passportNumber}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Passport Expiry">
                <input
                  name="passportExpiry"
                  type="date"
                  value={form.passportExpiry}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Labour Card Number">
                <input
                  name="labourCardNumber"
                  value={form.labourCardNumber}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Labour Card Expiry">
                <input
                  name="labourCardExpiry"
                  type="date"
                  value={form.labourCardExpiry}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Emirates ID Number">
                <input
                  name="emiratesIdNumber"
                  value={form.emiratesIdNumber}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Emirates ID Expiry">
                <input
                  name="emiratesIdExpiry"
                  type="date"
                  value={form.emiratesIdExpiry}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
              <Field label="Insurance Status">
                <select
                  name="insuranceStatus"
                  value={form.insuranceStatus}
                  onChange={handleChange}
                  className="luxury-input"
                >
                  <option value="none">None</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <Field label="Insurance Expiry">
                <input
                  name="insuranceExpiry"
                  type="date"
                  value={form.insuranceExpiry}
                  onChange={handleChange}
                  className="luxury-input"
                />
              </Field>
            </div>
            <div className="flex justify-between gap-2 mt-6">
              <button
                type="button"
                onClick={prev}
                className="btn-outline px-6 py-2"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={next}
                className="btn-gold px-6 py-2"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Documents */}
        {step === 5 && (
          <div className="luxury-card p-6 mb-6">
            <h2 className=" text-lg text-slate-800 mb-5 flex items-center gap-2">
              <span className="text-xs  text-slate-800 bg-obsidian-700 px-2 py-1 rounded">
                05
              </span>
              Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Photo" required>
                <FileUploadBox
                  label="Upload Photo"
                  name="photo"
                  accept=".jpg,.jpeg,.png"
                  file={files.photo}
                  onChange={handleFile}
                  icon={HiOutlinePhotograph}
                />
              </Field>
              <Field label="Passport" required>
                <FileUploadBox
                  label="Upload Passport PDF"
                  name="passport"
                  accept=".pdf,application/pdf"
                  file={files.passport}
                  onChange={handleFile}
                  icon={HiOutlineDocumentText}
                />
              </Field>
              <Field label="Visa">
                <FileUploadBox
                  label="Upload Visa PDF"
                  name="visa"
                  accept=".pdf,application/pdf"
                  file={files.visa}
                  onChange={handleFile}
                  icon={HiOutlineDocumentText}
                />
              </Field>
              <Field label="Emirates ID">
                <FileUploadBox
                  label="Upload Emirates ID PDF"
                  name="emiratesId"
                  accept=".pdf,application/pdf"
                  file={files.emiratesId}
                  onChange={handleFile}
                  icon={HiOutlineDocumentText}
                />
              </Field>
            </div>
            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={prev}
                className="btn-outline px-6 py-2"
              >
                Previous
              </button>
              <div className="flex items-center gap-4">
                <p className="text-slate-500 text-xs max-w-sm ml-2">
                  By submitting, you confirm the information is accurate and
                  consent to data processing.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold px-10 py-3 text-base"
                >
                  {loading ? "Submitting..." : "Submit Registration"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
