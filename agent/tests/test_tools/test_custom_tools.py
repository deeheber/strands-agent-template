"""Tests for custom tools."""

import pytest

from src.tools.custom_tools import letter_counter, unit_converter


@pytest.mark.parametrize(
    "value,source,target,expected",
    [
        (100, "c", "f", 212),
        (32, "f", "c", 0),
        (-40, "c", "f", -40),
        (1e308, "f", "c", 5.555555555555556e307),
        (1, "mi", "km", 1.609344),
        (1.609344, "km", "mi", 1),
        (1, "lb", "kg", 0.45359237),
        (0.45359237, "kg", "lb", 1),
        (0, "kg", "lb", 0),
        (12.5, " KM ", "km", 12.5),
    ],
)
def test_unit_converter(value, source, target, expected):
    assert unit_converter(value, source, target) == pytest.approx(expected)


@pytest.mark.parametrize(
    "value,source,target,message",
    [
        (1, "meters", "km", "Supported units"),
        (1, "km", "meters", "Supported units"),
        (1, "km", "kg", "different measurement categories"),
        (float("nan"), "c", "f", "Value must be finite"),
        (float("inf"), "km", "km", "Value must be finite"),
        (1e308, "c", "f", "Conversion result must be finite"),
        (1.2e308, "mi", "km", "Conversion result must be finite"),
        (1e308, "kg", "lb", "Conversion result must be finite"),
    ],
)
def test_unit_converter_rejects_invalid_conversion(value, source, target, message):
    with pytest.raises(ValueError, match=message):
        unit_converter(value, source, target)


class TestLetterCounter:
    """Test cases for the letter_counter tool."""

    def test_letter_counter_basic(self):
        """Test basic letter counting functionality."""
        assert letter_counter("hello", "l") == 2
        assert letter_counter("world", "o") == 1
        assert letter_counter("python", "p") == 1

    def test_letter_counter_case_insensitive(self):
        """Test that letter counting is case insensitive."""
        assert letter_counter("Hello", "h") == 1
        assert letter_counter("Hello", "H") == 1
        assert letter_counter("WORLD", "w") == 1
        assert letter_counter("WORLD", "W") == 1

    def test_letter_counter_no_matches(self):
        """Test letter counting when letter is not found."""
        assert letter_counter("hello", "x") == 0
        assert letter_counter("world", "z") == 0

    def test_letter_counter_invalid_letter_length(self):
        """Test that multi-character letters raise ValueError."""
        with pytest.raises(ValueError, match="must be a single character"):
            letter_counter("hello", "ll")

        with pytest.raises(ValueError, match="must be a single character"):
            letter_counter("hello", "")

    def test_letter_counter_special_characters(self):
        """Test letter counting with special characters."""
        assert letter_counter("hello!", "!") == 1
        assert letter_counter("test@example.com", "@") == 1
        assert letter_counter("a-b-c", "-") == 2
