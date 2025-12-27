import data from './placeholder-images.json';

type PlaceholderImage = {
    id: string;
    description: string;
    imageUrl: string;
    imageHint: string;
};

export const PlaceHolderImages: PlaceholderImage[] = data.placeholderImages;
