import { database } from '../firebaseAdmin.js'
import bcrypt from 'bcryptjs'
import { v1 as uuidv1 } from 'uuid';
import multer from 'multer';
import { ref as sRef, uploadBytesResumable } from 'firebase/storage';
import { getDownloadURL, getStorage, uploadBytes } from 'firebase/storage'


async function getAdviser(adviserid) {
    const adviserRef = database.ref('advisers/' + adviserid);
    const snapshot = await adviserRef.get();
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      throw new Error("Adviser not found");
    }
  }


  const createService = async (req, res) => {
    const { adviserid, service_name, about_service, duration, price, isPublished} = req.body;
  
    // Validate required fields
    if (!adviserid || !service_name || !about_service || !duration || !price ) {
      return res.status(400).json({ error: 'All fields (adviserid, service_name, about_service, duration, price) are required' });
    }
  
    try {
      const serviceid = uuidv1(); // Generate unique service ID if not provided
      const date = new Date().toString();
  
      // Create service data object
      const serviceData = {
        adviserid,
        service_name,
        about_service,
        duration,
        price,
        created_at:date,
        // isPublished: isPublished || false,
      };
  
      // Save the service data to the database
      await database.ref('advisers_service/' + serviceid).set(serviceData);
  
      // Update the adviser's service list
      const adviserData = await getAdviser(adviserid);
      const currentServices = adviserData.services || [];
      const updatedServices = [...currentServices, serviceid];
      await database.ref('advisers/' + adviserid).update({ services: updatedServices });
  
      // If the service is published, update the published_services list
      // if (isPublished) {
      //   const publishedServices = adviserData.published_services || [];
      //   const updatedPublishedServices = [...publishedServices, serviceid];
      //   await database.ref('advisers/' + adviserid).update({ published_services: updatedPublishedServices });
      // }
  
      res.status(200).json({ message: 'Service created successfully', serviceData });
    } catch (error) {
      console.error('Error during service creation:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
  };


  const getAllServicesByAdviser = async (req, res) => {
    const { adviserid } = req.params;
  
    // Validate adviser ID
    if (!adviserid) {
      return res.status(400).json({ error: 'Adviser ID is required' });
    }
  
    try {
  
      // Fetch all services from advisers_service node
      const servicesSnapshot = await database.ref('advisers_service').get();
  
      if (!servicesSnapshot.exists()) {
        return res.status(404).json({ error: 'No services found' });
      }
  
      const servicesData = servicesSnapshot.val();
      const adviserServices = [];
  
      // Loop through all services and check for matching adviserid
      for (const serviceid in servicesData) {
        if (servicesData[serviceid].adviserid === adviserid) {
          adviserServices.push({ serviceid, ...servicesData[serviceid] });
        }
      }
  
      // Check if any services were found for the adviser
      if (adviserServices.length === 0) {
        return res.status(200).json({ message: 'No services found for this adviser', services: [] });
      }
  
      return res.status(200).json({ services: adviserServices });
    } catch (error) {
      console.error('Error fetching adviser services:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
  };


  const editService = async (req, res) => {
    const { serviceid, adviserid, service_name, about_service, duration, price, isPublished } = req.body;
  
    // Validate required fields
    if (!serviceid || !adviserid) {
      return res.status(400).json({ error: 'Service ID and Adviser ID are required' });
    }
  
    try {
      // Fetch existing service data
      const serviceRef = database.ref('advisers_service/' + serviceid);
      const serviceSnapshot = await serviceRef.once('value');
  
      if (!serviceSnapshot.exists()) {
        return res.status(404).json({ error: 'Service not found' });
      }
  
      const serviceData = serviceSnapshot.val();
  
      // Check if the adviser matches the service
      if (serviceData.adviserid !== adviserid) {
        return res.status(403).json({ error: 'You are not authorized to edit this service' });
      }
  
      // Update the service data with new values
      const updatedServiceData = {
        ...serviceData,
        service_name: service_name || serviceData.service_name,
        about_service: about_service || serviceData.about_service,
        duration: duration || serviceData.duration,
        price: price || serviceData.price,
        // isPublished: typeof isPublished === 'boolean' ? isPublished : serviceData.isPublished,
        // updated_at: new Date().toString()
      };
  
      // Save the updated service data to the database
      await serviceRef.update(updatedServiceData);
  
      // Update the adviser's published_services list if isPublished is changed
      // const adviserData = await getAdviser(adviserid);
  
    
      // if (isPublished && !serviceData.isPublished) {
      //   const publishedServices = adviserData.published_services || [];
      //   const updatedPublishedServices = [...publishedServices, serviceid];
      //   await database.ref('advisers/' + adviserid).update({ published_services: updatedPublishedServices });
      // }
  
      // If the service is unpublished and was published before, remove it from the published_services list
      // if (!isPublished && serviceData.isPublished) {
      //   const publishedServices = adviserData.published_services || [];
      //   const updatedPublishedServices = publishedServices.filter(id => id !== serviceid);
      //   await database.ref('advisers/' + adviserid).update({ published_services: updatedPublishedServices });
      // }
  
      res.status(200).json({ message: 'Service updated successfully', updatedServiceData });
    } catch (error) {
      console.error('Error during service update:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
  };


  const savePaymentDetails = async (req, res) => {
    const { serviceid, userid, adviserid, scheduled_date, scheduled_time, paymentId } = req.body;
  
    if (!serviceid || !userid || !adviserid || !scheduled_date || !scheduled_time || !paymentId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      // Get the current date for the purchase
      const purchased_date = new Date().toISOString();
  
      // Construct the payment details object
      const paymentDetails = {
        serviceid,
        userid,
        adviserid,
        scheduled_date,
        scheduled_time,
        purchased_date
      };
  
      // Save payment details in Firebase Realtime Database under the payments node with the paymentId as key
      await database.ref('payments/' + paymentId).set(paymentDetails);
  
      // Return success response
      return res.status(200).json({ message: 'Payment details saved successfully' });
  
    } catch (error) {
      console.error('Error saving payment details:', error);
      return res.status(500).json({ message: 'Failed to save payment details', error: error.message });
    }
  };

export {
    createService,
    getAllServicesByAdviser,
    editService,
    savePaymentDetails
}