import * as legalService from '../services/legalService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

// ==============================================================================
// 1. COURT DATES CONTROLLERS
// ==============================================================================

export async function getAllCourtDates(req, res, next) {
  try {
    const { case_id, criminal_id, decision, search, station_id } = req.query;
    const hearings = await legalService.getAllCourtDates({
      caseId: case_id ? parseInt(case_id, 10) : null,
      criminalId: criminal_id ? parseInt(criminal_id, 10) : null,
      decision,
      search,
      stationId: station_id ? parseInt(station_id, 10) : null,
      userRole: req.user?.role,
      userStationId: req.user?.station_id,
    });
    return successResponse(res, hearings, 'Court hearings retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getCourtDateById(req, res, next) {
  try {
    const hearing = await legalService.getCourtDateById(req.params.id);
    return successResponse(res, hearing, 'Court hearing details retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createCourtDate(req, res, next) {
  try {
    const { case_id, criminal_id, hearing_date, court_name, judge_name, decision, notes } = req.body;
    if (!case_id || !hearing_date || !court_name || !judge_name) {
      return errorResponse(res, 'case_id, hearing_date, court_name, and judge_name are required.', 400);
    }
    const result = await legalService.createCourtDate(
      {
        case_id: parseInt(case_id, 10),
        criminal_id: criminal_id ? parseInt(criminal_id, 10) : null,
        hearing_date,
        court_name,
        judge_name,
        decision,
        notes,
      },
      req.user
    );
    return successResponse(res, result, 'Court hearing scheduled successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCourtDate(req, res, next) {
  try {
    const { hearing_date, court_name, judge_name, decision, notes } = req.body;
    const updated = await legalService.updateCourtDate(req.params.id, {
      hearing_date,
      court_name,
      judge_name,
      decision,
      notes,
    });
    return successResponse(res, updated, 'Court hearing updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteCourtDate(req, res, next) {
  try {
    const result = await legalService.deleteCourtDate(req.params.id, req.user);
    return successResponse(res, result, 'Court hearing cancelled successfully');
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 2. WARRANTS CONTROLLERS
// ==============================================================================

export async function getAllWarrants(req, res, next) {
  try {
    const { case_id, suspect_id, status, warrant_type, search, station_id } = req.query;
    const warrants = await legalService.getAllWarrants({
      caseId: case_id ? parseInt(case_id, 10) : null,
      suspectId: suspect_id ? parseInt(suspect_id, 10) : null,
      status,
      warrantType: warrant_type,
      search,
      stationId: station_id ? parseInt(station_id, 10) : null,
      userRole: req.user?.role,
      userStationId: req.user?.station_id,
    });
    return successResponse(res, warrants, 'Warrants retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getWarrantById(req, res, next) {
  try {
    const warrant = await legalService.getWarrantById(req.params.id);
    return successResponse(res, warrant, 'Warrant details retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createWarrant(req, res, next) {
  try {
    const {
      case_id,
      suspect_id,
      issuing_judge,
      warrant_type,
      issue_date,
      expiry_date,
      court_name,
      target_person_name,
      offense_sections,
      station_id,
      executing_officer_id,
      execution_notes,
    } = req.body;
    if (!case_id || !suspect_id || !issuing_judge || !warrant_type || !issue_date) {
      return errorResponse(res, 'case_id, suspect_id, issuing_judge, warrant_type, and issue_date are required.', 400);
    }
    const warrant = await legalService.createWarrant({
      case_id: parseInt(case_id, 10),
      suspect_id: parseInt(suspect_id, 10),
      issuing_judge,
      warrant_type,
      issue_date,
      expiry_date,
      court_name,
      target_person_name,
      offense_sections,
      station_id: station_id ? parseInt(station_id, 10) : req.user?.station_id,
      executing_officer_id: executing_officer_id ? parseInt(executing_officer_id, 10) : req.user?.id,
      execution_notes,
    });
    return successResponse(res, warrant, 'Judicial warrant registered successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateWarrantStatus(req, res, next) {
  try {
    const { status, execution_date } = req.body;
    if (!status) {
      return errorResponse(res, 'New status is required.', 400);
    }
    const updated = await legalService.updateWarrantStatus(req.params.id, { status, execution_date }, req.user);
    return successResponse(res, updated, 'Warrant status updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteWarrant(req, res, next) {
  try {
    const result = await legalService.deleteWarrant(req.params.id, req.user);
    return successResponse(res, result, 'Warrant removed successfully');
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 3. VICTIMS & WITNESSES CONTROLLERS
// ==============================================================================

export async function getAllWitnesses(req, res, next) {
  try {
    const { case_id, person_type, search, station_id } = req.query;
    const witnesses = await legalService.getAllWitnesses({
      caseId: case_id ? parseInt(case_id, 10) : null,
      personType: person_type,
      search,
      userRole: req.user?.role,
      stationId: station_id ? parseInt(station_id, 10) : null,
      userStationId: req.user?.station_id,
    });
    return successResponse(res, witnesses, 'Witness and victim records retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getWitnessById(req, res, next) {
  try {
    const witness = await legalService.getWitnessById(req.params.id, req.user.role);
    return successResponse(res, witness, 'Witness deposition details retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createWitness(req, res, next) {
  try {
    const { case_id, person_type, name, contact_info, statement, is_protected } = req.body;
    if (!case_id || !person_type || !name) {
      return errorResponse(res, 'case_id, person_type, and name are required.', 400);
    }
    const witness = await legalService.createWitness({
      case_id: parseInt(case_id, 10),
      person_type,
      name,
      contact_info,
      statement,
      is_protected,
    });
    return successResponse(res, witness, 'Witness statement registered successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateWitness(req, res, next) {
  try {
    const { person_type, name, contact_info, statement, is_protected } = req.body;
    const updated = await legalService.updateWitness(req.params.id, {
      person_type,
      name,
      contact_info,
      statement,
      is_protected,
    });
    return successResponse(res, updated, 'Witness statement updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteWitness(req, res, next) {
  try {
    const result = await legalService.deleteWitness(req.params.id);
    return successResponse(res, result, 'Witness statement removed successfully');
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 4. ARRESTS & PRECINCT CUSTODY CONTROLLERS
// ==============================================================================

export async function getAllArrests(req, res, next) {
  try {
    const { case_id, suspect_id, station_id, bail_status, search } = req.query;
    const arrests = await legalService.getAllArrests({
      caseId: case_id ? parseInt(case_id, 10) : null,
      suspectId: suspect_id ? parseInt(suspect_id, 10) : null,
      stationId: station_id ? parseInt(station_id, 10) : null,
      bailStatus: bail_status,
      search,
      userRole: req.user?.role,
      userStationId: req.user?.station_id,
    });
    return successResponse(res, arrests, 'Arrest records retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getArrestById(req, res, next) {
  try {
    const arrest = await legalService.getArrestById(req.params.id);
    return successResponse(res, arrest, 'Arrest booking details retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createArrest(req, res, next) {
  try {
    const {
      case_id,
      suspect_id,
      station_id,
      booking_timestamp,
      holding_cell_number,
      bail_status,
      bail_amount,
      arrestee_name,
      custody_type,
      magistrate_production_deadline,
      medical_exam_status,
      medical_officer_notes,
      relative_intimated,
      property_seized_inventory,
    } = req.body;
    if (!case_id || !suspect_id || !holding_cell_number) {
      return errorResponse(res, 'case_id, suspect_id, and holding_cell_number are required.', 400);
    }
    const assignedStationId = station_id ? parseInt(station_id, 10) : req.user.station_id;

    const arrest = await legalService.createArrest({
      case_id: parseInt(case_id, 10),
      suspect_id: parseInt(suspect_id, 10),
      arresting_officer_id: req.user.id,
      station_id: assignedStationId,
      booking_timestamp,
      holding_cell_number,
      bail_status,
      bail_amount,
      arrestee_name,
      custody_type,
      magistrate_production_deadline,
      medical_exam_status,
      medical_officer_notes,
      relative_intimated,
      property_seized_inventory,
    });
    return successResponse(res, arrest, 'Suspect booked into precinct custody successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateBailStatus(req, res, next) {
  try {
    const { bail_status, bail_amount, release_timestamp } = req.body;
    if (!bail_status) {
      return errorResponse(res, 'bail_status is required.', 400);
    }
    const updated = await legalService.updateBailStatus(req.params.id, {
      bail_status,
      bail_amount,
      release_timestamp,
    }, req.user);
    return successResponse(res, updated, 'Bail and lockup custody status updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteArrest(req, res, next) {
  try {
    const result = await legalService.deleteArrest(req.params.id, req.user);
    return successResponse(res, result, 'Detainee custody record removed successfully');
  } catch (err) {
    next(err);
  }
}
