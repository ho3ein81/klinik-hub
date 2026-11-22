import { Router } from 'express'

import adminUserRoutes from '../modules/adminUsers/adminUser.routes'

import adminClinicRoutes from '../modules/clinics/adminClinic.routes'
import clinicClinicRoutes from '../modules/clinics/clinicUserClinic.routes'

import clinicUserRoutes from '../modules/clinicUsers/clinicUser.routes'
import adminClinicUserRoutes from '../modules/clinicUsers/adminClinicUser.routes'

import adminClinicContactRoutes from '../modules/clinicContacts/adminClinicContact.routes'
import clinicClinicContactRoutes from '../modules/clinicContacts/clinicUserClinicContact.routes'

import adminServiceRoutes from '../modules/services/adminService.routes'
import clinicServiceRoutes from '../modules/services/clinicUserService.routes'

import adminSpecialtyRoutes from '../modules/specialties/adminSpecialty.routes'
import clinicSpecialtyRoutes from '../modules/specialties/clinicUserSpecialty.routes'

import adminDoctorAvailabilityRoutes from '../modules/doctorAvailabilities/adminDoctorAvailability.routes'
import clinicDoctorAvailabilityRoutes from '../modules/doctorAvailabilities/clinicUserDoctorAvailability.routes'
import patientDoctorAvailabilityRoutes from '../modules/doctorAvailabilities/patientDoctorAvailability.routes'

import adminDoctorBlockedTimeRoutes from '../modules/doctorBlockedTimes/adminDoctorBlockedTime.routes'
import clinicDoctorBlockedTimeRoutes from '../modules/doctorBlockedTimes/clinicUserDoctorBlockedTime.routes'

import adminClinicSettingRoutes from '../modules/clinicSettings/adminClinicSetting.routes'
import clinicClinicSettingRoutes from '../modules/clinicSettings/clinicUserClinicSetting.routes'
import patientClinicSettingRoutes from '../modules/clinicSettings/patientClinicSetting.routes'

import adminArticleRoutes from '../modules/articles/adminArticle.routes'
import clinicArticleRoutes from '../modules/articles/clinicUserArticle.routes'
import patientArticleRoutes from '../modules/articles/patientArticle.routes'

import adminPatientRoutes from '../modules/patients/adminPatient.routes'
import clinicPatientRoutes from '../modules/patients/clinicUserPatient.routes'
import patientRoutes from '../modules/patients/patient.routes'

import adminAppointmentRoutes from '../modules/appointments/adminAppointment.routes'
import clinicAppointmentRoutes from '../modules/appointments/clinicAppointment.routes'
import patientAppointmentRoutes from '../modules/appointments/patientAppointment.routes'

import patientServiceRoutes from '../modules/services/patientService.routes'
import patientClinicUserRoutes from '../modules/clinicUsers/patientClinicUser.routes'
import patientClinicStaffRoutes from '../modules/clinicUsers/patientClinicStaff.routes'
import patientClinicContactRoutes from '../modules/clinicContacts/patientClinicContact.routes'
import patientClinicRoutes from '../modules/clinics/patientClinic.routes'

const router = Router()

router.use('/admin/admin-users', adminUserRoutes)
router.use('/admin/clinic-users', adminClinicUserRoutes)
router.use('/admin/clinics', adminClinicRoutes)
router.use('/admin/clinic-contacts', adminClinicContactRoutes)
router.use('/admin/services', adminServiceRoutes)
router.use('/admin/specialties', adminSpecialtyRoutes)
router.use('/admin/doctor-availabilities', adminDoctorAvailabilityRoutes)
router.use('/admin/doctor-blocked-times', adminDoctorBlockedTimeRoutes)
router.use('/admin/clinic-settings', adminClinicSettingRoutes)
router.use('/admin/articles', adminArticleRoutes)
router.use('/admin/patients', adminPatientRoutes)
router.use('/admin/appointments', adminAppointmentRoutes)

router.use('/clinic/clinic-users', clinicUserRoutes)
router.use('/clinic/clinics', clinicClinicRoutes)
router.use('/clinic/clinic-contacts', clinicClinicContactRoutes)
router.use('/clinic/services', clinicServiceRoutes)
router.use('/clinic/specialties', clinicSpecialtyRoutes)
router.use('/clinic/doctor-availabilities', clinicDoctorAvailabilityRoutes)
router.use('/clinic/doctor-blocked-times', clinicDoctorBlockedTimeRoutes)
router.use('/clinic/clinic-settings', clinicClinicSettingRoutes)
router.use('/clinic/articles', clinicArticleRoutes)
router.use('/clinic/patients', clinicPatientRoutes)
router.use('/clinic/appointments', clinicAppointmentRoutes)

router.use('/patient/patients', patientRoutes)
router.use('/patient/appointments', patientAppointmentRoutes)
router.use('/patient/doctor-availabilities', patientDoctorAvailabilityRoutes)
router.use('/patient/services', patientServiceRoutes)
router.use('/patient/doctors', patientClinicUserRoutes)
router.use('/patient/staff', patientClinicStaffRoutes)
router.use('/patient/clinic-contacts', patientClinicContactRoutes)
router.use('/patient/clinic', patientClinicRoutes)
router.use('/patient/clinic-settings', patientClinicSettingRoutes)
router.use('/patient/articles', patientArticleRoutes)

export default router
