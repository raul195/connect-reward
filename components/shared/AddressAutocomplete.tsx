"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "123 Main St",
  className,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!API_KEY || autocompleteRef.current) return;

    async function init() {
      try {
        const { setOptions, importLibrary } = await import(
          "@googlemaps/js-api-loader"
        );
        setOptions({ key: API_KEY! });
        await importLibrary("places");
        setLoaded(true);
      } catch {
        // Gracefully degrade — just use the regular input
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "us" },
      fields: ["address_components", "formatted_address"],
      types: ["address"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.address_components) return;

      let street = "";
      let city = "";
      let state = "";
      let zip = "";

      for (const comp of place.address_components) {
        const type = comp.types[0];
        if (type === "street_number") street = comp.long_name;
        if (type === "route") street += (street ? " " : "") + comp.long_name;
        if (type === "locality") city = comp.long_name;
        if (type === "administrative_area_level_1") state = comp.short_name;
        if (type === "postal_code") zip = comp.long_name;
      }

      onChange(street);
      onSelect?.({ street, city, state, zip });
    });

    autocompleteRef.current = ac;
  }, [loaded, onChange, onSelect]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
