const fs = require("fs");
const PDFDocument = require("pdfkit");

const makePdf=function createInvoice(invoice, path) {
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
      formatCurrency(invoice.subtotal),
      150,
      customerInformationTop + 30
    )

    .font("public/Fonts/Poppins-Bold.ttf")
    .text(invoice.shipping.name, 350, customerInformationTop) //nAME OF THE CUSTOMER
    .font("public/Fonts/Poppins-Medium.ttf")
    .text(invoice.shipping.address, 350, customerInformationTop + 15) //ADDRESS OF THE CUSTOMER
    .text(
      invoice.shipping.city,
      350,
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
  generateTableRow( //heading of the table
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
  let subtotal=0
  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    subtotal+=item.amount
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow( //data of the  table
      doc,
      position,
      i+1,
      item.item,
      formatCurrency(item.amount / item.quantity),
      item.quantity,
      formatCurrency(item.amount)
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow( //adding new row
    doc,
    subtotalPosition,
    "",
    "",
    "Subtotal",
    "",
    formatCurrency(subtotal)
  );

  const discountToDatePosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    discountToDatePosition,
    "",
    "",
    "Discount",
    "",
    invoice.discount
  );

  const duePosition = discountToDatePosition + 25;
  doc.font("public/Fonts/Poppins-Bold.ttf");
  generateTableRow(
    doc,
    duePosition,
    "",
    "",
    "Grand Total",
    "",
    formatCurrency(invoice.subtotal)
  );
  doc.font("public/Fonts/Poppins-Medium.ttf");
}


function generateTableRow(
  doc,
  y,
  slno,
  name,
  unitCost,
  quantity,
  Total
) {
  const cellWidth = 90; // Width of each cell

  doc
    .fontSize(10)
    .text(slno, 50, y)
    .text(name, 150, y, { width: cellWidth,height:20 }) // Set a maximum width for the name cell
    .text(unitCost, 150 + cellWidth, y, { width: cellWidth, align: "right" })
    .text(quantity, 150 + 2 * cellWidth, y, { width: cellWidth, align: "right" })
    .text(Total, 150 + 3 * cellWidth, y, { width: cellWidth, align: "right" });
}


function generateHr(doc, y) { //function for drawing the line
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(cents) { //currenxct formating
  return "₹" + (cents / 100).toFixed(2);
}

function formatDate(date) { //function for formating the date
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}


module.exports=makePdf //creating the pdf

