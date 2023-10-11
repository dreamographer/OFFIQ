const fs = require("fs");
const PDFDocument = require("pdfkit");

function createInvoice(invoice, path) {
  let doc = new PDFDocument({ size: "A4", margin: 50 });

  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc)
  doc.end();
  doc.pipe(fs.createWriteStream(path));
}

// header part of the PDF
// data,x-axis,y-axix,options
function generateHeader(doc) {
  doc
    .image("public/invoice/offiq blacklogo.png", 35, 20, { width: 80 },{ align: "left" })
    .fillColor("#444444")
    .fontSize(20)
    .font('public/Fonts/Poppins-Bold.ttf')
    .text("OFFIQ.shop",0, 57,{ align: "center" })
    .fontSize(10)
    .text("OFFIQ.shop", 200, 50, { align: "right" })
    .text("Dotspace Business Park", 200, 65, { align: "right" })
    .text("Trivandrum, 695582", 200, 80, { align: "right" })
    .moveDown();
}


// FOoter of the PDF
function generateFooter(doc) {
	doc.fontSize(
		10,
	).text(
		'Thank You shop with us again',
		50,
		750,
		{ align: 'center', width: 500 },
	);
}

function generateCustomerInformation(doc, invoice) {
  doc
    .fillColor("#444444")
    .fontSize(20)
    .font('public/Fonts/Poppins-SemiBold.ttf')
    .text("Invoice", 50, 160);

  generateHr(doc, 185); //horizontal line

  const customerInformationTop = 200; //position of the data

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("public/Fonts/Poppins-Bold.ttf")
    .text(invoice.invoice_nr, 150, customerInformationTop)
    .font("public/Fonts/Poppins-Medium.ttf")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(formatDate(new Date()), 150, customerInformationTop + 15)
    .text("Grand Total:", 50, customerInformationTop + 30)
    .text(
      '₹300',
      150,
      customerInformationTop + 30
    )

    .font("public/Fonts/Poppins-Bold.ttf")
    .text(invoice.shipping.name, 300, customerInformationTop) //nAME OF THE CUSTOMER
    .font("public/Fonts/Poppins-Medium.ttf")
    .text(invoice.shipping.address, 300, customerInformationTop + 15) //ADDRESS OF THE CUSTOMER
    .text(
      invoice.shipping.city +
        ", " +
        invoice.shipping.state +
        ", " +
        invoice.shipping.country,
      300,
      customerInformationTop + 30
    )
    .moveDown();

  generateHr(doc, 252);
}

// generate the table for the items
function generateInvoiceTable(doc, invoice) {
  let i;
  const invoiceTableTop = 350;

  doc.font("public/Fonts/Poppins-Bold.ttf");
  generateTableRow(
    doc,
    invoiceTableTop,
    "SL.No",
    "Name",
    "Unit Cost",
    "Quantity",
    "Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("public/Fonts/Poppins-Medium.ttf");

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      i+1,
      item.description,
      formatCurrency(item.amount / item.quantity),
      item.quantity,
      formatCurrency(item.amount)
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "",
    "Subtotal",
    "",
    formatCurrency(invoice.subtotal)
  );

  const paidToDatePosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    paidToDatePosition,
    "",
    "",
    "Paid To Date",
    "",
    formatCurrency(invoice.paid)
  );

  const duePosition = paidToDatePosition + 25;
  doc.font("public/Fonts/Poppins-Bold.ttf");
  generateTableRow(
    doc,
    duePosition,
    "",
    "",
    "Balance Due",
    "",
    formatCurrency(invoice.subtotal - invoice.paid)
  );
  doc.font("public/Fonts/Poppins-Medium.ttf");
}


function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(cents) {
  return "$" + (cents / 100).toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}


const invoice = {
  shipping: {
    name: "John Doe",
    address: "1234 Main Street",
    city: "San Francisco",
    state: "CA",
    country: "US",
    postal_code: 94111
  },
  items: [
    {
      item: "TC 100",
      description: "Toner Cartridge",
      quantity: 2,
      amount: 6000
    },
    {
      item: "USB_EXT",
      description: "USB Cable Extender",
      quantity: 1,
      amount: 2000
    }
  ],
  subtotal: 8000,
  paid: 0,
  invoice_nr: 1234
};

createInvoice(invoice, "invoice.pdf");
