import React from 'react';

const DeleteConfirmation = ({ category, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h3 className="text-xl font-bold mb-4 text-center">Are you sure you want to delete the sound "{category.title}"?</h3>
        <div className="flex justify-end space-x-2">
          <button onClick={onConfirm} className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600">Yes</button>
          <button onClick={onClose} className="bg-gray-300 py-2 px-4 rounded hover:bg-gray-400">No</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;