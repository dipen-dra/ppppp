import React from 'react';
import api from '../api/api';

const EsewaPayment = ({ bookingId }) => {
  const handleEsewaPayment = async () => {
    try {
      const response = await api.post('/payment/esewa/initiate', { bookingId });
      const { signature, ...esewaData } = response.data;

      const form = document.createElement('form');
      form.setAttribute('method', 'POST');
      form.setAttribute('action', esewaData.ESEWA_URL);

      for (const key in esewaData) {
        const hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden');
        hiddenField.setAttribute('name', key);
        hiddenField.setAttribute('value', esewaData[key]);
        form.appendChild(hiddenField);
      }
      
      const signatureField = document.createElement('input');
      signatureField.setAttribute('type', 'hidden');
      signatureField.setAttribute('name', 'signature');
      signatureField.setAttribute('value', signature);
      form.appendChild(signatureField);


      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Error initiating eSewa payment:', error);
    }
  };

  return (
    <button
      onClick={handleEsewaPayment}
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
    >
      Pay with eSewa
    </button>
  );
};

export default EsewaPayment;