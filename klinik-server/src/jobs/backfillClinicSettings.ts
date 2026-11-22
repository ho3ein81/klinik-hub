import prisma from '../db/prisma'
import { env } from '../config/env'
import { logger } from '../utils/logger'
import { clinicRepository } from '../modules/clinics/clinic.repository'
import { clinicSettingRepository } from '../modules/clinicSettings/clinicSetting.repository'

/** Ensures every existing clinic has a ClinicSetting row, so lookups by
 * clinicId never 404 for clinics created before this feature existed. */
export async function backfillClinicSettings(): Promise<void> {
  const { data: clinicsMissingSettings } = await clinicRepository.findAll({
    where: {
      clinicSetting: null,
    },
  })

  if (clinicsMissingSettings.length === 0) {
    return
  }

  await clinicSettingRepository.createMany(
    clinicsMissingSettings.map((clinic) => ({
      clinicId: clinic.id,
      allowPatientBooking: env.DEFAULT_ALLOW_PATIENT_BOOKING,
    })),
  )

  logger.info(
    `Backfilled ClinicSetting for ${clinicsMissingSettings.length} clinic(s).`,
  )
}
