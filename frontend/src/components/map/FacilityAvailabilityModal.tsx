import React, { useState } from 'react';
import { X, Navigation, UserCheck, UserX, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Facility } from '@/types/facility_types';

interface FacilityAvailabilityModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (facility: Facility) => void;
  onReportStatus: (facility: Facility, isOccupied: boolean) => void;
  isOccupied: boolean;
  lastReportTime?: number;
}

const FacilityAvailabilityModal: React.FC<FacilityAvailabilityModalProps> = ({
  facility,
  isOpen,
  onClose,
  onNavigate,
  onReportStatus,
  isOccupied,
  lastReportTime
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'available' | 'occupied' | null>(null);

  if (!facility) return null;

  const handleStatusReport = () => {
    if (selectedStatus !== null) {
      onReportStatus(facility, selectedStatus === 'occupied');
      onClose();
    }
  };

  const getTimeSinceReport = () => {
    if (!lastReportTime) return null;
    const minutes = Math.floor((Date.now() - lastReportTime) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[1001]"
            onClick={onClose}
          />

          {/* Modal - Slide from right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[1002]"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {facility.name || facility.class}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">{facility.class}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-6">
                {/* Current Status */}
                {lastReportTime && (
                  <div className={`p-4 rounded-lg ${isOccupied ? 'bg-red-50' : 'bg-green-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isOccupied ? 'bg-red-500' : 'bg-green-500'
                      }`}>
                        {isOccupied ? <UserX className="text-white" size={20} /> : <UserCheck className="text-white" size={20} />}
                      </div>
                      <div>
                        <p className={`font-medium ${isOccupied ? 'text-red-800' : 'text-green-800'}`}>
                          Currently {isOccupied ? 'Occupied' : 'Available'}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Clock size={12} />
                          Reported {getTimeSinceReport()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Report Status Section */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Is this facility available?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedStatus('available')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedStatus === 'available'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <UserCheck className={`mx-auto mb-2 ${
                        selectedStatus === 'available' ? 'text-green-600' : 'text-gray-600'
                      }`} size={32} />
                      <p className={`font-medium ${
                        selectedStatus === 'available' ? 'text-green-700' : 'text-gray-700'
                      }`}>Available</p>
                    </button>

                    <button
                      onClick={() => setSelectedStatus('occupied')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedStatus === 'occupied'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <UserX className={`mx-auto mb-2 ${
                        selectedStatus === 'occupied' ? 'text-red-600' : 'text-gray-600'
                      }`} size={32} />
                      <p className={`font-medium ${
                        selectedStatus === 'occupied' ? 'text-red-700' : 'text-gray-700'
                      }`}>Occupied</p>
                    </button>
                  </div>
                </div>

                {/* Additional Info */}
                {facility.additional_info && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-1">Additional Information</h4>
                    <p className="text-sm text-gray-600">{facility.additional_info}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 border-t space-y-3">
                <button
                  onClick={() => {
                    onNavigate(facility);
                    onClose();
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation size={20} />
                  Navigate to Facility
                </button>

                {selectedStatus !== null && (
                  <button
                    onClick={handleStatusReport}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Submit Availability Report
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FacilityAvailabilityModal;