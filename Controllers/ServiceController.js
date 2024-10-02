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
    const { adviserid, service_name, about_service, duration, price, isPublished } = req.body;
  
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
        isPublished: isPublished || false,
      };
  
      // Save the service data to the database
      await database.ref('advisers_service/' + serviceid).set(serviceData);
  
      // Update the adviser's service list
      const adviserData = await getAdviser(adviserid);
      const currentServices = adviserData.services || [];
      const updatedServices = [...currentServices, serviceid];
      await database.ref('advisers/' + adviserid).update({ services: updatedServices });
  
      // If the service is published, update the published_services list
      if (isPublished) {
        const publishedServices = adviserData.published_services || [];
        const updatedPublishedServices = [...publishedServices, serviceid];
        await database.ref('advisers/' + adviserid).update({ published_services: updatedPublishedServices });
      }
  
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

export {
    createService,
    getAllServicesByAdviser
}