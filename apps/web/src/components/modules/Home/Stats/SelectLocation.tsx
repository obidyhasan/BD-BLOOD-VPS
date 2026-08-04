"use client";

import { useState } from "react";

import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const Divisions = [{ name: "Dhaka" }, { name: "Khulna" }, { name: "Sylhet" }];
const khulnaDistricts = [{ name: "Khulna" }, { name: "Bagerhat" }];
const bagerhatUpazilas = [{ name: "Rampal" }, { name: "Mongla" }];
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SelectLocation = ({ isButton }: { isButton: boolean }) => {
  const [division, setDivision] = useState<string>();
  const [district, setDistrict] = useState<string>();
  const [upzila, setUpazila] = useState<string>();

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Division */}
        <Field>
          <Select value={division} onValueChange={setDivision}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Divisions.map((item) => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {/* District */}
        <Field>
          <Select
            disabled={division ? false : true}
            value={district}
            onValueChange={setDistrict}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {khulnaDistricts.map((item) => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {/* Upazila */}
        <Field>
          <Select
            disabled={district ? false : true}
            value={upzila}
            onValueChange={setUpazila}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Upazila" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {bagerhatUpazilas.map((item) => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
      {isButton && (
        <Button disabled={upzila ? false : true}>
          <Link href={"/organization/organization-name"}>
            Go To Organization
          </Link>
        </Button>
      )}
    </div>
  );
};

export default SelectLocation;
