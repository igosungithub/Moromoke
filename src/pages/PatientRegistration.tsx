import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useUIStore } from '../store/uiStore';
import type { Patient } from '../types';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']),
  race: z.string().optional(),
  ethnicity: z.string().optional(),
  language: z.string().optional(),
  phone: z.string().min(1, 'Phone is required'),
  alternatePhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  maritalStatus: z.string().optional(),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  emergencyContacts: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phone: z.string().min(1, 'Phone is required'),
    email: z.string().optional(),
  })),
  insurance: z.object({
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
    groupNumber: z.string().optional(),
    subscriberName: z.string().optional(),
    subscriberDOB: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  primaryCareProvider: z.string().optional(),
  dnrStatus: z.boolean().optional(),
  advanceDirective: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function PatientRegistration() {
  const navigate = useNavigate();
  const { addPatient } = usePatientStore();
  const { addNotification } = useUIStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'male',
      bloodType: 'unknown',
      address: { country: 'Nigeria' },
      emergencyContacts: [{ name: '', relationship: '', phone: '' }],
      language: 'English',
    },
  });

  const { fields: ecFields, append: ecAppend, remove: ecRemove } = useFieldArray({
    control,
    name: 'emergencyContacts',
  });

  function onSubmit(data: FormData) {
    const patient = addPatient({
      ...data,
      allergies: [],
      currentMedications: [],
      status: 'waiting' as const,
      insurance: data.insurance?.provider ? {
        provider: data.insurance.provider,
        policyNumber: data.insurance.policyNumber || '',
        groupNumber: data.insurance.groupNumber || '',
        subscriberName: data.insurance.subscriberName || '',
        subscriberDOB: data.insurance.subscriberDOB || '',
        relationship: data.insurance.relationship || 'Self',
      } : undefined,
      emergencyContacts: data.emergencyContacts.map((ec, i) => ({ ...ec, id: `ec-new-${i}` })),
    } as Omit<Patient, 'id' | 'mrn' | 'registrationDate' | 'encounters' | 'vitalsHistory' | 'labResults' | 'imagingOrders' | 'clinicalNotes' | 'triageAssessments'>);

    addNotification({
      type: 'success',
      title: 'Patient Registered',
      message: `${data.firstName} ${data.lastName} has been registered successfully.`,
    });
    navigate(`/patients/${patient.id}`);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus size={22} className="text-blue-600" />
            New Patient Registration
          </h1>
          <p className="text-sm text-gray-500">Complete all required fields to register a new patient</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input {...register('firstName')} className="input-field" placeholder="First name" />
              {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label">Middle Name</label>
              <input {...register('middleName')} className="input-field" placeholder="Middle name" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input {...register('lastName')} className="input-field" placeholder="Last name" />
              {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="label">Date of Birth *</label>
              <input {...register('dateOfBirth')} type="date" className="input-field" />
              {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth.message}</p>}
            </div>
            <div>
              <label className="label">Gender *</label>
              <select {...register('gender')} className="select-field">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="label">Blood Type *</label>
              <select {...register('bloodType')} className="select-field">
                {['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'].map((bt) => (
                  <option key={bt} value={bt}>{bt === 'unknown' ? 'Unknown' : bt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Race</label>
              <select {...register('race')} className="select-field">
                <option value="">Select race</option>
                <option>Black or African American</option>
                <option>White</option>
                <option>Asian</option>
                <option>Hispanic or Latino</option>
                <option>American Indian / Alaska Native</option>
                <option>Native Hawaiian / Pacific Islander</option>
                <option>Other</option>
                <option>Prefer not to disclose</option>
              </select>
            </div>
            <div>
              <label className="label">Preferred Language</label>
              <input {...register('language')} className="input-field" placeholder="Language" />
            </div>
            <div>
              <label className="label">Marital Status</label>
              <select {...register('maritalStatus')} className="select-field">
                <option value="">Select</option>
                <option>Single</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widowed</option>
                <option>Separated</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Primary Phone *</label>
              <input {...register('phone')} className="input-field" placeholder="Phone number" />
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="label">Alternate Phone</label>
              <input {...register('alternatePhone')} className="input-field" placeholder="Alternate phone" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Email Address</label>
              <input {...register('email')} type="email" className="input-field" placeholder="Email address" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Street Address *</label>
              <input {...register('address.street')} className="input-field" placeholder="Street address" />
              {errors.address?.street && <p className="form-error">{errors.address.street.message}</p>}
            </div>
            <div>
              <label className="label">City *</label>
              <input {...register('address.city')} className="input-field" placeholder="City" />
              {errors.address?.city && <p className="form-error">{errors.address.city.message}</p>}
            </div>
            <div>
              <label className="label">State/Province *</label>
              <input {...register('address.state')} className="input-field" placeholder="State" />
              {errors.address?.state && <p className="form-error">{errors.address.state.message}</p>}
            </div>
            <div>
              <label className="label">ZIP/Postal Code *</label>
              <input {...register('address.zip')} className="input-field" placeholder="ZIP code" />
              {errors.address?.zip && <p className="form-error">{errors.address.zip.message}</p>}
            </div>
            <div>
              <label className="label">Country *</label>
              <input {...register('address.country')} className="input-field" placeholder="Country" />
              {errors.address?.country && <p className="form-error">{errors.address.country.message}</p>}
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h2 className="text-base font-semibold text-gray-900">Emergency Contacts</h2>
            <button
              type="button"
              onClick={() => ecAppend({ name: '', relationship: '', phone: '' })}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              Add Contact
            </button>
          </div>
          <div className="space-y-4">
            {ecFields.map((field, index) => (
              <div key={field.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Contact {index + 1}</h3>
                  {ecFields.length > 1 && (
                    <button type="button" onClick={() => ecRemove(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Full Name *</label>
                    <input {...register(`emergencyContacts.${index}.name`)} className="input-field" placeholder="Full name" />
                    {errors.emergencyContacts?.[index]?.name && (
                      <p className="form-error">{errors.emergencyContacts[index]?.name?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Relationship *</label>
                    <select {...register(`emergencyContacts.${index}.relationship`)} className="select-field">
                      <option value="">Select relationship</option>
                      {['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Guardian', 'Other'].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                    {errors.emergencyContacts?.[index]?.relationship && (
                      <p className="form-error">{errors.emergencyContacts[index]?.relationship?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Phone *</label>
                    <input {...register(`emergencyContacts.${index}.phone`)} className="input-field" placeholder="Phone number" />
                    {errors.emergencyContacts?.[index]?.phone && (
                      <p className="form-error">{errors.emergencyContacts[index]?.phone?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input {...register(`emergencyContacts.${index}.email`)} type="email" className="input-field" placeholder="Email" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insurance */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b">Insurance Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Insurance Provider</label>
              <input {...register('insurance.provider')} className="input-field" placeholder="e.g. NHIS, HMO" />
            </div>
            <div>
              <label className="label">Policy Number</label>
              <input {...register('insurance.policyNumber')} className="input-field" placeholder="Policy number" />
            </div>
            <div>
              <label className="label">Group Number</label>
              <input {...register('insurance.groupNumber')} className="input-field" placeholder="Group number" />
            </div>
            <div>
              <label className="label">Subscriber Name</label>
              <input {...register('insurance.subscriberName')} className="input-field" placeholder="Subscriber name" />
            </div>
            <div>
              <label className="label">Subscriber Date of Birth</label>
              <input {...register('insurance.subscriberDOB')} type="date" className="input-field" />
            </div>
            <div>
              <label className="label">Relationship to Patient</label>
              <select {...register('insurance.relationship')} className="select-field">
                <option value="">Select</option>
                <option>Self</option>
                <option>Spouse</option>
                <option>Child</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clinical Information */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b">Clinical Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Occupation</label>
              <input {...register('occupation')} className="input-field" placeholder="Occupation" />
            </div>
            <div>
              <label className="label">Employer</label>
              <input {...register('employer')} className="input-field" placeholder="Employer" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Primary Care Provider</label>
              <input {...register('primaryCareProvider')} className="input-field" placeholder="Primary care provider name" />
            </div>
            <div className="flex items-center gap-3">
              <input {...register('dnrStatus')} type="checkbox" id="dnr" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <label htmlFor="dnr" className="text-sm font-medium text-gray-700">DNR (Do Not Resuscitate)</label>
            </div>
            <div className="flex items-center gap-3">
              <input {...register('advanceDirective')} type="checkbox" id="ad" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <label htmlFor="ad" className="text-sm font-medium text-gray-700">Has Advance Directive</label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            <Save size={16} />
            Register Patient
          </button>
        </div>
      </form>
    </div>
  );
}
