import { useState } from 'react';

const INDUSTRIES = ['Healthcare', 'Finance', 'Legal', 'Manufacturing', 'Retail', 'Other'];
const EMPLOYEE_COUNTS = ['1-25', '26-100', '101-500', '500+'];

export default function IntakeForm({ onSubmit }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    org_name: '',
    industry: '',
    employee_count: '',
    contact_name: '',
    contact_email: '',
    assessor_name: '',
    assessment_date: today,
  });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.org_name.trim()) newErrors.org_name = 'Required';
    if (!form.industry) newErrors.industry = 'Required';
    if (!form.employee_count) newErrors.employee_count = 'Required';
    if (!form.contact_name.trim()) newErrors.contact_name = 'Required';
    if (!form.contact_email.trim()) newErrors.contact_email = 'Required';
    if (!form.assessment_date) newErrors.assessment_date = 'Required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(form);
  }

  const inputClass =
    'w-full px-3.5 py-2.5 bg-surface-0 border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200';
  const labelClass = 'block text-[11px] font-medium text-subtle mb-1.5 uppercase tracking-[0.08em]';

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">New Assessment</h1>
        <p className="text-muted text-sm mt-1">Enter organization details to begin</p>
      </div>

      <form onSubmit={handleSubmit} className="border border-white/[0.06] rounded-2xl bg-surface-1 p-7 space-y-5">
        <div>
          <label htmlFor="org_name" className={labelClass}>Organization Name</label>
          <input id="org_name" type="text" className={inputClass} placeholder="Acme Corp" value={form.org_name} onChange={(e) => update('org_name', e.target.value)} />
          {errors.org_name && <p className="text-red-400 text-[11px] mt-1">{errors.org_name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="industry" className={labelClass}>Industry</label>
            <select id="industry" className={inputClass} value={form.industry} onChange={(e) => update('industry', e.target.value)}>
              <option value="">Select</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            {errors.industry && <p className="text-red-400 text-[11px] mt-1">{errors.industry}</p>}
          </div>
          <div>
            <label htmlFor="employee_count" className={labelClass}>Employees</label>
            <select id="employee_count" className={inputClass} value={form.employee_count} onChange={(e) => update('employee_count', e.target.value)}>
              <option value="">Select</option>
              {EMPLOYEE_COUNTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.employee_count && <p className="text-red-400 text-[11px] mt-1">{errors.employee_count}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_name" className={labelClass}>Contact Name</label>
            <input id="contact_name" type="text" className={inputClass} placeholder="Jane Doe" value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} />
            {errors.contact_name && <p className="text-red-400 text-[11px] mt-1">{errors.contact_name}</p>}
          </div>
          <div>
            <label htmlFor="contact_email" className={labelClass}>Contact Email</label>
            <input id="contact_email" type="email" className={inputClass} placeholder="jane@acme.com" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} />
            {errors.contact_email && <p className="text-red-400 text-[11px] mt-1">{errors.contact_email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="assessor_name" className={labelClass}>Assessor <span className="text-zinc-600 normal-case tracking-normal">(optional)</span></label>
            <input id="assessor_name" type="text" className={inputClass} placeholder="Your name" value={form.assessor_name} onChange={(e) => update('assessor_name', e.target.value)} />
          </div>
          <div>
            <label htmlFor="assessment_date" className={labelClass}>Date</label>
            <input id="assessment_date" type="date" className={inputClass} value={form.assessment_date} onChange={(e) => update('assessment_date', e.target.value)} />
            {errors.assessment_date && <p className="text-red-400 text-[11px] mt-1">{errors.assessment_date}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors duration-200 shadow-lg shadow-accent/20"
        >
          Begin Assessment
        </button>
      </form>
    </div>
  );
}
