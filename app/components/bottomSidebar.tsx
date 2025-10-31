// components/BottomSidebar.tsx
"use client";
import React, { useState } from "react";
import { User } from "lucide-react";
import Image from "next/image";

const BottomSidebar = () => {
  const [open, setOpen] = useState(false);

  // 🔹 Static sample talents with images
  const talents = [
    {
      id: 1,
      name: "John Doe",
      role: "Frontend Developer",
      img: "/assets/Lebron.png",
    },
    {
      id: 2,
      name: "Jane Smith",
      role: "UI/UX Designer",
      img: "/assets/Lebron.png",
    },
    {
      id: 3,
      name: "Alex Tan",
      role: "Project Manager",
      img: "/assets/Lebron.png",
    },
    {
      id: 4,
      name: "Alex Tan",
      role: "Project Manager",
      img: "/assets/Lebron.png",
    },
    {
      id: 5,
      name: "Alex Tan",
      role: "Project Manager",
      img: "/assets/Lebron.png",
    },
    {
      id: 6,
      name: "Alex Tan",
      role: "Project Manager",
      img: "/assets/Lebron.png",
    },
  ];

  return (
    <div className="fixed bottom-4 right-6 z-50">
      {/* Button (unchanged) */}
      <div
        onClick={() => setOpen(!open)}
        className={`
          bg-yellow-400 rounded-2xl px-6 py-3 cursor-pointer
          flex items-center justify-center shadow-md
          transition-all duration-200 ease-in-out
          ${open ? "scale-110 shadow-lg" : "hover:scale-105 hover:shadow-lg"}
        `}
      >
        <div className="flex flex-col items-center text-black">
          <span className="text-sm font-bold">{talents.length}</span>
          <User size={22} />
        </div>
      </div>

      {/* Popup list (taller version) */}
      {open && (
        <div
          className="
            absolute bottom-24 right-0 w-[28rem] bg-white border border-gray-200 
            rounded-3xl shadow-2xl p-6 transition-all duration-300
          "
        >
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            Added Talents
          </h3>

          <ul className="space-y-4 max-h-[36rem] overflow-y-auto pr-2">
            {talents.map((talent) => (
              <li
                key={talent.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition"
              >
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden">
                  <Image
                    src={talent.img}
                    alt={talent.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-800">
                    {talent.name}
                  </p>
                  <p className="text-sm text-gray-600">{talent.role}</p>
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setOpen(false)}
            className="
              mt-5 w-full bg-yellow-400 text-black py-3 rounded-2xl 
              font-semibold text-base hover:bg-yellow-500 transition
            "
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default BottomSidebar;
