import { useEffect, useState } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
} from "@chakra-ui/react";
import useAddBookings from "../../hooks/useAddBookings";
import useManageBookings from "../../hooks/useManageBookings";
import Button from "../buttons/Button";
import { sendEmail } from "../Utils/Data";
import axios from "axios";

const BookingsForm = () => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const { availableSlots, handleDateChange, selectedDate, timeSlotWithPrice } =
    useManageBookings();
  const [timeSlot, setTimeSlot] = useState("");

  //newly created price use state for dynamic price calculation according to slot
  const [prices, setPrices] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const { CreateBookings } = useAddBookings();
  const toast = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const paymentSuccess = urlParams.get("PaymentSuccess");

  useEffect(() => {
    if (paymentSuccess === "true") {
      handlePaymentSuccess();
    } else if (paymentSuccess === "false") {
      handlePaymentFailure();
    }
  }, [paymentSuccess]);

  const handlePaymentSuccess = () => {
    toast({
      title: "Booking Successful",
      description: "Your booking has been confirmed.",
      status: "success",
      duration: 7000,
      position: "top",
      isClosable: true,
    });
    handleBookingAndEmail();
    setShowMessage(true);
    setName("");
    setContact("");
    handleDateChange("");
    setTimeSlot("");
    setPrices("");
  };

  const handlePaymentFailure = () => {
    setShowMessage(true);
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      status: "error",
      duration: 7000,
      position: "top",
      isClosable: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      contact.length !== 10 ||
      name.trim() === "" ||
      selectedDate === "" ||
      timeSlot === ""
    ) {
      setShowAlert(true);
      return;
    }

    try {
      const {
        data: { key },
      } = await axios.get("https://fcarena-final.vercel.app/api/getkey");

      const {
        data: { order },
      } = await axios.post("https://fcarena-final.vercel.app/api/checkout", {
        amount: prices,
      });

      const options = {
        key,
        amount: prices,
        currency: "INR",
        name: "Om",
        description: "Tutorial of RazorPay",
        image: "https://avatars.githubusercontent.com/u/48543687?v=4",
        order_id: order.id,
        handler: async function (response) {
          const {
            data: { success },
          } = await axios.post("https://fcarena-final.vercel.app/api/paymentverification",
            {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }
          );
          if (success) {
            handlePaymentSuccess();
          } else {
            handlePaymentFailure();
          }
        },
        prefill: {
          name: name,
          email: "gaurav.kumar@example.com",
          contact: contact,
        },
        notes: {
          address: "Razorpay Corporate Office",
        },
        theme: {
          color: "#121212",
        },
      };
      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error) {
      console.log(error);
    }
  };

  const handleBookingAndEmail = async () => {
    await CreateBookings({
      name,
      contact,
      date: selectedDate,
      timeSlot,
    });

    await sendEmail({
      name,
      email: contact,
      message: `Booking Details:\nName: ${name}\nContact: ${contact}\nDate: ${selectedDate}\nTime Slot: ${timeSlot}`,
      date: selectedDate,
      timeSlot,
    });
  };

  return (
    <section className="bookings py-12 md:pt-[7%] pt-[31%]">
      <div className="container mx-auto">
        <fieldset className="border-dashed border-primary border-2 px-12 py-5 pb-[50px] md:max-w-[50%] max-w-full mx-auto">
          <legend className="text-4xl pb-3 text-primary font-semibold">
            Book Turf Now
          </legend>
          <form onSubmit={handleSubmit}>
            <FormControl className="flex flex-col gap-6">
              <div>
                <FormLabel className="text-xl text-primary font-bold">
                  Name
                </FormLabel>
                <Input
                  type="text"
                  className="border-2 p-2 rounded-lg w-full border-primary"
                  placeholder="Enter Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setShowAlert(false);
                  }}
                />
                {name.trim() === "" && showAlert && (
                  <span className="text-red-600">Please Enter Name</span>
                )}
              </div>
              <div>
                <FormLabel className="text-xl text-primary font-bold">
                  Contact
                </FormLabel>
                <Input
                  type="tel"
                  className="border-2 p-2 rounded-lg w-full border-primary"
                  placeholder="Enter Phone Number"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
                {contact.length !== 10 && showAlert && (
                  <span className="text-red-600">
                    Please Enter a Valid Contact Number
                  </span>
                )}
              </div>
              <div>
                <FormLabel className="text-xl text-primary font-bold">
                  Date
                </FormLabel>
                <Input
                  type="date"
                  className="border-2 p-2 rounded-lg w-full border-primary"
                  placeholder="Enter Phone Number"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              <div>
                <FormLabel className="text-xl text-primary font-bold">
                  Time Slot
                </FormLabel>
                <Select
                  placeholder="Select from Available Slots"
                  value={timeSlot}
                  onChange={(e) => {
                    const selectedSlot = e.target.value;
                    setTimeSlot(selectedSlot);
                    // Find the slot object corresponding to the selected time
                    const selectedSlotObject = availableSlots.find(
                      (slot) => slot.time === selectedSlot
                    );
                    // If the slot object is found, update the price state
                    if (selectedSlotObject) {
                      setPrices(selectedSlotObject.price)
                    }
                  }}
                >
                  {availableSlots.map((slot, index) => (
                    <option key={index} value={slot.time}>
                      {slot.time}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                role={"button"}
                label={"Book"}
                type={"submit"}
                customClass={
                  "border-2 rounded ms:max-w-[30%] p-2 px-7 mt-4 mx-auto text-lg font-medium"
                }
                variant={"outlinePrimary"}
                id="pay-button"
              />
            </FormControl>
          </form>
        </fieldset>
      </div>
    </section>
  );
};

export default BookingsForm;
