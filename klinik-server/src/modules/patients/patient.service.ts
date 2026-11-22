import { OtpPurpose, Prisma } from '@prisma/client'
import { DbClient } from '../../db/base.repository'
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/errors'
import {
  AuthTokenPayload,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt'
import {
  CreatePatientRequestDto,
  LoginPatientRequestDto,
  LoginPatientResponseDto,
  PatientResponseDto,
  RefreshPatientTokenResponseDto,
  ResolveOrCreatePatientDto,
  UpdatePatientRequestDto,
} from './patient.dto'
import { toPatientResponseDto } from './patient.mapper'
import { PaginationParams } from '../../types/pagination'
import { withScope } from '../../utils/scope'
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationMeta,
} from '../../utils/pagination'
import { patientRepository } from './patient.repository'
import { clinicRepository } from '../clinics/clinic.repository'
import { generateOtp, verifyOtp } from '../otp/otp.service'
import { buildSearchWhere } from '../../utils/buildSearchWhere'

interface GetPatientsParams extends PaginationParams {
  clinicId?: string
  authenticatedClinicId?: string
  search?: string
}

export async function getPatients(
  params: GetPatientsParams,
): Promise<{ data: PatientResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const where = withScope(
    {
      ...(params.clinicId && { clinicId: params.clinicId }),
      ...buildSearchWhere<Prisma.PatientWhereInput>(params.search, [
        'firstName',
        'lastName',
        'phone',
      ]),
    },
    params.authenticatedClinicId,
  )

  const { data, total } = await patientRepository.findAll({
    where,
    orderBy: { createdAt: params.sortOrder ?? 'desc' },
    skip,
    take,
  })

  return {
    data: data.map(toPatientResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function createPatient(
  data: CreatePatientRequestDto,
  authenticatedClinicId?: string,
): Promise<PatientResponseDto> {
  const clinicId = authenticatedClinicId || data.clinicId

  const clinic = await clinicRepository.findById(clinicId)

  if (!clinic) {
    throw new NotFoundError('Clinic not found')
  }

  const existingPatient = await patientRepository.findFirst({
    clinicId,
    phone: data.phone,
  })

  if (existingPatient) {
    throw new ConflictError(
      'Patient with this phone already exists in this clinic',
    )
  }

  const patient = await patientRepository.create({
    clinicId,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    address: data.address,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    avatar: data.avatar,
  })

  return toPatientResponseDto(patient)
}

export async function getPatientById(
  id: string,
  authenticatedClinicId?: string,
): Promise<PatientResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)

  const patient = await patientRepository.findFirst(where)

  if (!patient) {
    throw new NotFoundError('Patient not found')
  }

  return toPatientResponseDto(patient)
}

export async function updatePatient(
  id: string,
  data: UpdatePatientRequestDto,
  authenticatedClinicId?: string,
): Promise<PatientResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)

  const existingPatient = await patientRepository.findFirst(where)

  if (!existingPatient) {
    throw new NotFoundError('Patient not found')
  }

  if (data.phone && data.phone !== existingPatient.phone) {
    const phoneExists = await patientRepository.findFirst({
      clinicId: existingPatient.clinicId,
      phone: data.phone,
    })

    if (phoneExists) {
      throw new ConflictError(
        'Patient with this phone already exists in this clinic',
      )
    }
  }

  const patient = await patientRepository.updateOne(where, data)
  return toPatientResponseDto(patient)
}

export async function deletePatient(
  id: string,
  authenticatedClinicId?: string,
): Promise<void> {
  const where = withScope({ id }, authenticatedClinicId)
  const existingPatient = await patientRepository.findFirst(where)

  if (!existingPatient) {
    throw new NotFoundError('Patient not found')
  }

  await patientRepository.deleteOne(where)
}

export async function requestPatientOtp(phone: string): Promise<void> {
  const patient = await patientRepository.findFirst({ phone })

  if (!patient) {
    throw new NotFoundError('Patient not found')
  }

  await generateOtp(phone, OtpPurpose.LOGIN)
}

export async function loginPatient(
  data: LoginPatientRequestDto,
): Promise<LoginPatientResponseDto> {
  await verifyOtp(data.phone, data.code, OtpPurpose.LOGIN)

  const patient = await patientRepository.findFirst({ phone: data.phone })

  if (!patient) {
    throw new NotFoundError('Patient not found')
  }

  const accessToken = generateAccessToken(patient.id, 'patient')
  const refreshToken = generateRefreshToken(patient.id, 'patient')

  return {
    accessToken,
    refreshToken,
    patient: toPatientResponseDto(patient),
  }
}

export async function refreshPatientToken(
  refreshToken: string,
): Promise<RefreshPatientTokenResponseDto> {
  let payload: AuthTokenPayload

  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token')
  }

  if (payload.userType !== 'patient') {
    throw new UnauthorizedError('Invalid refresh token')
  }

  const patient = await patientRepository.findFirst({ id: payload.userId })

  if (!patient) {
    throw new UnauthorizedError('Patient does not exist')
  }

  const accessToken = generateAccessToken(patient.id, 'patient')
  const newRefreshToken = generateRefreshToken(patient.id, 'patient')

  return {
    accessToken,
    refreshToken: newRefreshToken,
  }
}

/**
 * Pass `client` (the `tx` from `unitOfWork`) when the caller needs the
 * possible patient creation to commit or roll back together with other
 * writes it makes in the same unit of work (e.g. creating the appointment
 * that references this patient).
 */
export async function resolveOrCreatePatient(
  params: ResolveOrCreatePatientDto,
  authenticatedClinicId?: string,
  client?: DbClient,
): Promise<PatientResponseDto> {
  const clinicId = authenticatedClinicId || params.clinicId
  const clinic = await clinicRepository.findById(clinicId, {}, client)
  if (!clinic) {
    throw new NotFoundError('Clinic not found')
  }

  if (params.patientId) {
    const patient = await patientRepository.findFirst(
      { id: params.patientId, clinicId },
      {},
      client,
    )

    if (!patient) {
      throw new NotFoundError('Patient not found')
    }

    return toPatientResponseDto(patient)
  } else {
    if (!params.firstName || !params.lastName || !params.phone) {
      throw new ConflictError(
        'Provide either patientId or firstName, lastName and phone',
      )
    }

    let patient = await patientRepository.findFirst(
      { clinicId: params.clinicId, phone: params.phone },
      {},
      client,
    )

    if (!patient) {
      patient = await patientRepository.create(
        {
          clinicId: params.clinicId,
          firstName: params.firstName,
          lastName: params.lastName,
          phone: params.phone,
          dateOfBirth: params.dateOfBirth
            ? new Date(params.dateOfBirth)
            : undefined,
        },
        client,
      )
    }

    return toPatientResponseDto(patient)
  }
}
