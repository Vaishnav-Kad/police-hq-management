import * as analyticsService from '../services/analyticsService.js';
import { successResponse } from '../utils/responseHelper.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const stationId = req.query.station_id ? parseInt(req.query.station_id, 10) : null;
    const summary = await analyticsService.getDashboardSummary(stationId);
    return successResponse(res, summary, 'Dashboard KPI metrics retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getCrimeTypeDistribution(req, res, next) {
  try {
    const stationId = req.query.station_id ? parseInt(req.query.station_id, 10) : null;
    const distribution = await analyticsService.getCrimeTypeDistribution(stationId);
    return successResponse(res, distribution, 'Crime category distribution retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyCrimeTrends(req, res, next) {
  try {
    const stationId = req.query.station_id ? parseInt(req.query.station_id, 10) : null;
    const trends = await analyticsService.getMonthlyCrimeTrends(stationId);
    return successResponse(res, trends, 'Monthly crime trends retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getOfficerPerformance(req, res, next) {
  try {
    const stationId = req.query.station_id ? parseInt(req.query.station_id, 10) : null;
    const performance = await analyticsService.getOfficerPerformance(stationId);
    return successResponse(res, performance, 'Officer performance statistics retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getAreaCrimeRates(req, res, next) {
  try {
    const rates = await analyticsService.getAreaCrimeRates();
    return successResponse(res, rates, 'Precinct crime statistics retrieved');
  } catch (err) {
    next(err);
  }
}
