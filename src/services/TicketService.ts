import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { db } from '../lib/db';

export class TicketService {
  /**
   * Generates a PDF ticket for a specific booking.
   * Includes QR code, passenger details, and trip info.
   */
  static async generateTicketPDF(bookingId: string): Promise<string> {
    // 1. Fetch full booking details
    const booking = await db
      .selectFrom('bookings')
      .innerJoin('trips', 'bookings.trip_id', 'trips.id')
      .innerJoin('routes', 'trips.route_id', 'routes.id')
      .innerJoin('operators', 'routes.operator_id', 'operators.id')
      .select([
        'bookings.reference_code',
        'bookings.total_amount',
        'bookings.currency',
        'trips.departure_time',
        'routes.origin',
        'routes.destination',
        'operators.name as operator_name'
      ])
      .where('bookings.id', '=', bookingId)
      .executeTakeFirst();

    if (!booking) throw new Error('Booking not found');

    const seats = await db
      .selectFrom('booking_seats')
      .innerJoin('seats', 'booking_seats.seat_id', 'seats.id')
      .where('booking_seats.booking_id', '=', bookingId)
      .select(['seats.seat_identifier', 'booking_seats.passenger_name'])
      .execute();

    // 2. Generate QR Code (Base64)
    // We encode the reference and booking ID for verification
    const qrText = `https://zimbus.co.zw/verify/${booking.reference_code}`;
    const qrDataUrl = await QRCode.toDataURL(qrText, {
        width: 200,
        margin: 2,
        color: {
            dark: '#1e293b', // slate-800
            light: '#ffffff'
        }
    });

    // 3. Create PDF
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Styling
    const primaryColor = [79, 70, 229]; // indigo-600
    const textColor = [30, 41, 59]; // slate-800
    const lightText = [100, 116, 139]; // slate-500

    // Header bg
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('ZIMBUS BOARDING PASS', 20, 25);

    // Operator Name (Top Right)
    doc.setFontSize(10);
    doc.text(booking.operator_name.toUpperCase(), 190, 25, { align: 'right' });

    // Main Content
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Reference Box
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(20, 50, 170, 30, 3, 3, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text('BOOKING REFERENCE', 30, 60);
    
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('courier', 'bold'); // Mono for reference
    doc.text(booking.reference_code, 30, 72);

    // QR Code
    doc.addImage(qrDataUrl, 'PNG', 145, 52, 26, 26);

    // Trip Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text('ROUTE', 20, 95);
    doc.text('DATE & TIME', 110, 95);

    doc.setFontSize(12);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${booking.origin} to ${booking.destination}`, 20, 102);
    
    const departDate = new Date(booking.departure_time);
    doc.text(`${departDate.toDateString()} at ${departDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 110, 102);

    // Passenger / Seat Table
    doc.setLineWidth(0.1);
    doc.line(20, 115, 190, 115);

    doc.setFontSize(9);
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text('PASSENGER NAME', 20, 122);
    doc.text('SEAT', 170, 122);

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(11);
    
    let yPos = 130;
    seats.forEach((seat) => {
        doc.text(seat.passenger_name || 'Guest Passenger', 20, yPos);
        doc.text(seat.seat_identifier, 170, yPos);
        yPos += 8;
    });

    // Fare Summary
    doc.line(20, yPos + 5, 190, yPos + 5);
    doc.setFontSize(10);
    doc.text('TOTAL FARE PAID', 20, yPos + 15);
    doc.setFontSize(14);
    doc.text(`${booking.currency} ${booking.total_amount}`, 190, yPos + 15, { align: 'right' });

    // Footer / Terms
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.setFontSize(8);
    const footerY = 270;
    doc.text('TERMS & CONDITIONS', 20, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text('1. Please arrive 30 minutes before departure.', 20, footerY + 5);
    doc.text('2. All passengers must present a valid National ID or Passport.', 20, footerY + 8);
    doc.text('3. This ticket is non-refundable 24 hours prior to departure.', 20, footerY + 11);

    // Return as Base64/Data URI
    return doc.output('datauristring');
  }

  /**
   * Generates a trip manifest (CSV format or multi-page table).
   */
  static async generateManifest(tripId: string): Promise<string> {
     // Implementation for a tabular manifest intended for conductors
     // (Can be added later in Phase 2)
     return 'Manifest content...';
  }
}
