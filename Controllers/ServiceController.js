import { database } from '../firebaseAdmin.js'
import bcrypt from 'bcryptjs'
import { v1 as uuidv1 } from 'uuid';
import moment from 'moment';
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
    const { serviceid, userid, adviserid, scheduled_date, scheduled_time, paymentId ,meetingid} = req.body;


  
    if (!serviceid || !userid || !adviserid || !scheduled_date || !scheduled_time || !paymentId || !meetingid) {
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
        meetingid,
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




// Function to generate the next 30 days in the given format
function generateNext30Days() {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const currentDay = new Date(today);
    currentDay.setDate(today.getDate() + i);

    const options = { day: '2-digit', month: 'short', weekday: 'short' };
    const formattedDate = currentDay.toLocaleDateString('en-GB', options); // E.g., '10 Oct Thu'
    const dayName = currentDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // Get full day name (monday, tuesday, etc.)

    dates.push({ date: formattedDate, dayName });
  }

  return dates;
}

// Controller to get the upcoming 20 days' availability for an adviser
async function getAdviserAvailability(req, res) {
  const { adviserid } = req.params;

  try {
    // Fetch adviser data
    const adviserData = await getAdviser(adviserid);

    if (!adviserData || !adviserData.availability) {
      return res.status(404).json({ error: 'Adviser not found or availability not set.' });
    }

    // Map adviser's availability to a day-timing object
    const adviserAvailability = adviserData.availability.reduce((acc, item) => {
      acc[item.day.toLowerCase()] = item.timing; // e.g., { monday: "9:00 AM - 5:00 PM", tuesday: "10:00 AM - 6:00 PM" }
      return acc;
    }, {});

    // Generate upcoming 30 days
    const upcomingDays = generateNext30Days();

    // Filter and map upcoming days based on adviser's availability with two date formats
    const availableDays = upcomingDays
      .filter(day => adviserAvailability[day.dayName]) // Match day names
      .map(day => ({
        dateFormatted: day.date, // e.g., '10 Oct Thu'
        dateISO: moment(day.date, 'DD MMM ddd').format('YYYY-MM-DD'), // e.g., '2024-10-10' (ISO format)
        timing: adviserAvailability[day.dayName] // e.g., '9:00 AM - 5:00 PM'
      }));

    res.status(200).json({ availability: availableDays });
  } catch (error) {
    console.error('Error fetching adviser availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


function generateTimeSlots(startTime, endTime, duration) {
  const slots = [];
  let current = moment(startTime, 'h:mm A');
  const end = moment(endTime, 'h:mm A');

  while (current < end) {
    const slotStart = current.format('h:mm A');
    current.add(duration, 'minutes');
    const slotEnd = current.format('h:mm A');
    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
    });
  }

  return slots;
}

// Function to check if two time ranges overlap
function isOverlapping(existingStart, existingEnd, slotStart, slotEnd) {
  const existingStartTime = moment(existingStart, 'h:mm A');
  const existingEndTime = moment(existingEnd, 'h:mm A');
  const slotStartTime = moment(slotStart, 'h:mm A');
  const slotEndTime = moment(slotEnd, 'h:mm A');

  // Return true if there is any overlap between the existing slot and the new slot
  return slotStartTime.isBefore(existingEndTime) && slotEndTime.isAfter(existingStartTime);
}

async function getAvailableTimeSlots(req, res) {
  const { adviserid, scheduledDate, timing, duration } = req.body; // timing: "9:00 AM - 5:00 PM"

  try {
    // Split the provided timing into start and end time
    const [startTime, endTime] = timing.split(' - '); // Example: "9:00 AM - 5:00 PM"

    // Generate time slots based on the provided duration
    const timeSlots = generateTimeSlots(startTime, endTime, duration);

    // Fetch existing bookings for the adviser on the selected date
    const snapshot = await database
      .ref('payments')
      .orderByChild('adviserid')
      .equalTo(adviserid)
      .once('value');

    const existingBookings = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const payment = childSnapshot.val();
        if (payment.scheduled_date === scheduledDate) {
          // Add the start and end times of the booked slots to the existingBookings array
          const [existingStart, existingEnd] = payment.scheduled_time.split(' - ');
          existingBookings.push({ existingStart, existingEnd });
        }
      });
    }

    const availableSlots = timeSlots.map((slot) => {
      // Check if the current slot overlaps with any existing booking
      const isBooked = existingBookings.some((booking) =>
        isOverlapping(booking.existingStart, booking.existingEnd, slot.startTime, slot.endTime)
      );

      return {
        slot: `${slot.startTime} - ${slot.endTime}`, // e.g., "9:00 AM - 10:00 AM"
        available: !isBooked ? 'yes' : 'no', // 'yes' for available, 'no' for booked
      };
    });

    // Return the available slots with the booked flag
    res.status(200).json({
      adviserid,
      scheduledDate,
      availableSlots,
    });
  } catch (error) {
    console.error('Error generating available time slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



const getBookingsOfUser = async (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Fetch all bookings where the userid or adviserid matches the provided userid
    const snapshot = await database
      .ref('payments')
      .orderByChild('userid')
      .equalTo(userid)
      .once('value');
      
    const adviserSnapshot = await database
      .ref('payments')
      .orderByChild('adviserid')
      .equalTo(userid)
      .once('value');

    // Combine both user and adviser bookings
    const bookingsData = { ...snapshot.val(), ...adviserSnapshot.val() };

    if (!bookingsData) {
      return res.status(404).json({ message: 'No bookings found for this user' });
    }

    let bookings = Object.keys(bookingsData).map((key) => ({
      paymentId: key,
      ...bookingsData[key],
    }));

    // Function to convert '9:00 Am - 10:00 Am' time slot into Date object for sorting
    const convertTimeSlotToDate = (dateStr, timeStr) => {
      const [startTime] = timeStr.split(' - ');
      return new Date(`${dateStr} ${startTime}`);
    };

    // Sort the bookings by scheduled_date and scheduled_time
    bookings.sort((a, b) => {
      const dateA = new Date(a.scheduled_date);
      const dateB = new Date(b.scheduled_date);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;

      // If dates are the same, sort by time
      const timeA = convertTimeSlotToDate(a.scheduled_date, a.scheduled_time);
      const timeB = convertTimeSlotToDate(b.scheduled_date, b.scheduled_time);
      return timeA - timeB;
    });

    // Populate service, adviser, and user details
    for (let booking of bookings) {
      // Populate service details
      const serviceSnapshot = await database
        .ref(`advisers_service/${booking.serviceid}`)
        .once('value');
      booking.serviceDetails = serviceSnapshot.val();

      // Populate limited adviser details, with checks for null/undefined
      const adviserSnapshot = await database
        .ref(`advisers/${booking.adviserid}`)
        .once('value');
      const adviserData = adviserSnapshot.val();
      
      if (adviserData) {
        booking.adviserDetails = {
          name: adviserData.username || 'N/A', // Fallback to 'N/A' if name is missing
          professional_title: adviserData.professional_title || 'N/A',
          profile_picture: adviserData.profile_photo || 'N/A', // Include necessary details
        };
      } else {
        booking.adviserDetails = { name: 'N/A', professional_title: 'N/A', profile_picture: 'N/A', username: 'N/A' };
      }

      // Populate limited user details, with checks for null/undefined
      const userSnapshot = await database
        .ref(`advisers/${booking.userid}`)
        .once('value');
      const userData = userSnapshot.val();
      
      if (userData) {
        booking.userDetails = {
          name: userData.username || 'N/A', // Fallback to 'N/A' if name is missing
          email: userData.email || 'N/A',
        };
      } else {
        booking.userDetails = { name: 'N/A', email: 'N/A', username: 'N/A' };
      }
    }

    // Return the sorted and populated bookings with reduced load
    return res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
};


const deleteService = async (req, res) => {
  const { serviceid, adviserid } = req.body;

  // Validate required fields
  if (!serviceid || !adviserid) {
    return res.status(400).json({ error: 'Both serviceid and adviserid are required' });
  }

  try {
    // Check if the service exists
    const serviceRef = database.ref('advisers_service/' + serviceid);
    const serviceSnapshot = await serviceRef.once('value');
    
    if (!serviceSnapshot.exists()) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Delete the service from the 'advisers_service' node
    await serviceRef.remove();

    // Update the adviser's service list
    const adviserData = await getAdviser(adviserid);
    const currentServices = adviserData.services || [];

    if (!currentServices.includes(serviceid)) {
      return res.status(404).json({ error: 'Service not associated with this adviser' });
    }

    // Remove the service from the adviser's services list
    const updatedServices = currentServices.filter(id => id !== serviceid);
    await database.ref('advisers/' + adviserid).update({ services: updatedServices });

    // Optional: Remove from published services if it exists in that list
    // const publishedServices = adviserData.published_services || [];
    // const updatedPublishedServices = publishedServices.filter(id => id !== serviceid);
    // await database.ref('advisers/' + adviserid).update({ published_services: updatedPublishedServices });

    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error during service deletion:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};





export {
    createService,
    getAllServicesByAdviser,
    editService,
    savePaymentDetails,
    getAdviserAvailability,
    getAvailableTimeSlots,
    getBookingsOfUser,
    deleteService
}