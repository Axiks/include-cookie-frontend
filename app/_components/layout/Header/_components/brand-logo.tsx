import { Box, Text } from "@radix-ui/themes";

export default function BrandLogo() {
    return (
        <>
            {/* Full name on wider screens */}
            <Box as="span" display={{ initial: "none", xs: "inline" }}>
                Programmers <Text id="brand-accent">&</Text> Cookies
            </Box>
            {/* Shortened to "P&C" on phones */}
            <Box as="span" display={{ initial: "inline", xs: "none" }}>
                P<Text className="brand-color">&</Text>C
            </Box>
        </>
    )
}
