import { AppointmentStatus, DayOfWeek } from '@prisma/client'
import { ConflictError } from '../../utils/errors'
import { doctorAvailabilityRepository } from '../doctorAvailabilities/doctorAvailability.repository'
import { appointmentRepository } from './appointment.repository'
import {
  computeDurationMinutes,
  getDayOfWeek,
  timeRangesOverlap,
  timeToMinutes,
} from '../../utils/dateHelper'
