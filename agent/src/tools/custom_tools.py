"""Custom tools for the agent."""

import math

from strands import tool


@tool
def unit_converter(value: float, from_unit: str, to_unit: str) -> float:
    """Convert temperature (c, f), distance (km, mi), or mass (kg, lb).

    Args:
        value: Finite numeric value to convert.
        from_unit: Source unit: c, f, km, mi, kg, or lb (case-insensitive).
        to_unit: Target unit from the same measurement category.

    Returns:
        Converted value without rounding.

    Raises:
        ValueError: If the value is non-finite, units are unsupported or incompatible,
            or the conversion overflows.
    """
    units = {
        "c": ("temperature", 1.0),
        "f": ("temperature", 1.0),
        "km": ("distance", 1.0),
        "mi": ("distance", 1.609344),
        "kg": ("mass", 1.0),
        "lb": ("mass", 0.45359237),
    }
    source, target = from_unit.strip().lower(), to_unit.strip().lower()
    if source not in units or target not in units:
        raise ValueError("Supported units: c, f, km, mi, kg, lb")
    if units[source][0] != units[target][0]:
        raise ValueError("Cannot convert between different measurement categories")
    if not math.isfinite(value):
        raise ValueError("Value must be finite")

    if source == target:
        result = float(value)
    elif source == "c":
        result = value * (9 / 5) + 32
    elif source == "f":
        result = (value - 32) * (5 / 9)
    else:
        result = value * (units[source][1] / units[target][1])
    if not math.isfinite(result):
        raise ValueError("Conversion result must be finite")
    return result


@tool
def letter_counter(word: str, letter: str) -> int:
    """Count how many times a letter appears in a word.

    Args:
        word: The word to search in
        letter: The letter to count (must be a single character)

    Returns:
        The number of times the letter appears in the word (case-insensitive)

    Raises:
        ValueError: If letter is not a single character
    """
    if not isinstance(word, str) or not isinstance(letter, str):
        return 0

    if len(letter) != 1:
        raise ValueError("The 'letter' parameter must be a single character")

    return word.lower().count(letter.lower())
