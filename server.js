require('dotenv').config();
const express = require("express");
const serverless = require("serverless-http");

const cors = require("cors");

const app = express();
app.use(cors()); // Enable CORS if testing from a different frontend

const steps = [
  "ISAConnect",
  "ISAHealth",
  "ISAFirmware",
  "ISABrakeCal",
  "ISAAccelCal",
  "ISAVerfiyCal",
  "ISAOptions",
];
const verifySteps = ["Verify1", "Verify2", "Verify3"];

const result = [];

const errorSamples = [
  {
    Error: "E001",
    ErrorMessage: "Connection failed. Please check the network.",
    Status: "Abort",
    ResumeStep: "ISAConnect",
  },
  {
    Error: "E002",
    ErrorMessage: "Health check timed out.",
    Status: "Repeat",
    ResumeStep: "ISAHealth",
  },
  {
    Error: "E003",
    ErrorMessage: "Firmware version mismatch.",
    Status: "Abort",
    ResumeStep: "ISAFirmware",
  },
  {
    Error: "E004",
    ErrorMessage: "Brake calibration incomplete.",
    Status: "Repeat",
    ResumeStep: "ISABrakeCal",
  },
  {
    Error: "E005",
    ErrorMessage: "Unexpected pedal position value.",
    Status: "Repeat",
    ResumeStep: "ISAAccelCal",
  },
];

steps.forEach((step) => {
  for (let i = 0; i < 5; i++) {
    const shouldHaveError = Math.random() < 0; // currently 0% chance to show an error

    result.push({
      CurrentStep: step,
      StepInfo: shouldHaveError
        ? null
        : {
            Completion: i * 25,
            PopupStep:
              step === "ISAVerfiyCal"
                ? verifySteps[Math.floor(Math.random() * verifySteps.length)]
                : step,
            PedalPosition: (Math.random() * 100).toFixed(0),
            EngineRPM: (Math.random() * 100).toFixed(0),
          },
      ErrorInfo: shouldHaveError
        ? {
            ...errorSamples[Math.floor(Math.random() * errorSamples.length)],
          }
        : null,
    });
  }
});

let interval = null;
let count = 0;
let isPaused = false;

app.get("/service/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!interval) {
    interval = setInterval(() => {
      const data = result[count];

      if (!data) {
        clearInterval(interval);
        interval = null;
        return;
      }

      // Always send data if it has ErrorInfo
      if (data.ErrorInfo) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        isPaused = true;
        count++;
        return;
      }

      // If not paused, send normal data
      if (!isPaused) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        count++;
      }

      // If paused and no error, skip sending
    }, 2000);
  }

  req.on("close", () => {
    console.log("Client disconnected. Closing SSE connection...");
    clearInterval(interval);
    interval = null;
    count = 0;
    isPaused = false;
    res.end();
  });
});

app.post("/service/resume", (req, res) => {
  isPaused = false;
  count = count + 1;
  res.setHeader("Content-Type", "application/json");
  setTimeout(() => {
    res.json({ message: "Stream resumed" });
  }, 2000);
});

app.post("/service/cancel", (req, res) => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  count = 0;
  isPaused = false;

  res.setHeader("Content-Type", "application/json");
  setTimeout(() => {
    res.json({ message: "Stream canceled and clients disconnected" });
  }, 2000);
});

app.post("/service/steps", (req, res) => {
  res.setHeader("Content-Type", "tapplication/json");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  setTimeout(() => {
    res.json({
      PlusLiteReady: true,
      ServiceInfo: "ISA Installation",
      ServiceSteps: [
        {
          StepName: "Verify Connected Device",
          StepAbbreviation: "ISAConnect",
          StepStatusType: "Message",
        },
        {
          StepName: "Device Health Check",
          StepAbbreviation: "ISAHealth",
          StepStatusType: "Progress",
        },
        {
          StepName: "Firmware Check",
          StepAbbreviation: "ISAFirmware",
          StepStatusType: "Progress",
        },
        {
          StepName: "Brake Calibration",
          StepAbbreviation: "ISABrakeCal",
          StepStatusType: "Popup",
        },
        {
          StepName: "Accelerator Calibration",
          StepAbbreviation: "ISAAccelCal",
          StepStatusType: "Popup",
        },
        {
          StepName: "Verify Calibration",
          StepAbbreviation: "ISAVerfiyCal",
          StepStatusType: "Popup",
        },
        {
          StepName: "Option Configuration",
          StepAbbreviation: "ISAOptions",
          StepStatusType: "Progress",
        },
      ],
    });
  }, 2000);
});

app.post("/service/start", (req, res) => {
  res.setHeader("Content-Type", "tapplication/json");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  setTimeout(() => {
    res.json({
      startPerfomService: true,
      ServiceInfo: "ISA Installation",
      ServiceSteps: [
        {
          StepName: "Verify Connected Device",
          StepAbbreviation: "ISAConnect",
          StepStatusType: "Message",
        },
        {
          StepName: "Device Health Check",
          StepAbbreviation: "ISAHealth",
          StepStatusType: "Progress",
        },
        {
          StepName: "Firmware Check",
          StepAbbreviation: "ISAFirmware",
          StepStatusType: "Progress",
        },
        {
          StepName: "Brake Calibration",
          StepAbbreviation: "ISABrakeCal",
          StepStatusType: "Popup",
        },
        {
          StepName: "Accelerator Calibration",
          StepAbbreviation: "ISAAccelCal",
          StepStatusType: "Popup",
        },
        {
          StepName: "Verify Calibration",
          StepAbbreviation: "ISAVerfiyCal",
          StepStatusType: "Popup",
        },
        {
          StepName: "Option Configuration",
          StepAbbreviation: "ISAOptions",
          StepStatusType: "Progress",
        },
      ],
    });
  }, 2000);
});
app.post("/service/temper", (req, res) => {
  isPaused = false;
  count = count + 1;
  setTimeout(() => {
    res.setHeader("Content-Type", "application/json");
    res.json({ message: "Device is not tempered resumed" });
  }, 2000);
});
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({ message: "Server is running ..." });

});

const PORT = process.env.PORT||900;

app.listen(PORT, () =>
  console.log(`SSE server running at http://localhost:${PORT}`)
);
// Export handler for serverless
